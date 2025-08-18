/**
 * Resource Folder Management Service for ThinkSpace
 * 
 * This service provides folder-based organization for resources with
 * nested folder support, path management, and hierarchical operations.
 */

import prisma from './prisma';
import type {
  ResourceFolder,
  CreateFolderRequest,
  UpdateFolderRequest,
  FolderTreeNode,
  BulkResourceOperation,
  BulkOperationResult
} from '../types/resources';

// =============================================================================
// CORE FOLDER MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Create a new resource folder
 */
export async function createResourceFolder(
  request: CreateFolderRequest,
  userId: string
): Promise<ResourceFolder> {
  try {
    // Validate parent folder if specified
    let parentFolder = null;
    if (request.parentId) {
      parentFolder = await prisma.resourceFolder.findFirst({
        where: {
          id: request.parentId,
          userId,
        },
      });

      if (!parentFolder) {
        throw new Error('Parent folder not found or access denied');
      }
    }

    // Calculate path and level
    const path = parentFolder 
      ? `${parentFolder.path}/${request.name}`
      : `/${request.name}`;
    const level = parentFolder ? parentFolder.level + 1 : 0;

    // Check for duplicate names at the same level
    const existingFolder = await prisma.resourceFolder.findFirst({
      where: {
        name: request.name,
        parentId: request.parentId || null,
        userId,
      },
    });

    if (existingFolder) {
      throw new Error('A folder with this name already exists at this level');
    }

    // Create the folder
    const folder = await prisma.resourceFolder.create({
      data: {
        name: request.name,
        description: request.description,
        color: request.color || '#6366f1',
        parentId: request.parentId,
        path,
        level,
        userId,
      },
      include: {
        parent: true,
        children: true,
        resources: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    // Transform null values to undefined to match our TypeScript interface
    return {
      ...folder,
      description: folder.description ?? undefined,
      color: folder.color ?? undefined,
      parentId: folder.parentId ?? undefined,
      parent: folder.parent ? {
        ...folder.parent,
        description: folder.parent.description ?? undefined,
        color: folder.parent.color ?? undefined,
        parentId: folder.parent.parentId ?? undefined,
      } : undefined,
      children: folder.children.map(child => ({
        ...child,
        description: child.description ?? undefined,
        color: child.color ?? undefined,
        parentId: child.parentId ?? undefined,
      })),
    } as ResourceFolder;
  } catch (error) {
    console.error('Error creating resource folder:', error);
    throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update a resource folder
 */
export async function updateResourceFolder(
  folderId: string,
  updates: UpdateFolderRequest,
  userId: string
): Promise<ResourceFolder> {
  try {
    // Verify folder ownership
    const folder = await prisma.resourceFolder.findFirst({
      where: {
        id: folderId,
        userId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!folder) {
      throw new Error('Folder not found or access denied');
    }

    // Handle parent change (move folder)
    let newPath = folder.path;
    let newLevel = folder.level;

    if (updates.parentId !== undefined) {
      if (updates.parentId === folderId) {
        throw new Error('A folder cannot be its own parent');
      }

      // Check for circular reference
      if (updates.parentId && await isCircularReference(folderId, updates.parentId, userId)) {
        throw new Error('Moving folder would create a circular reference');
      }

      // Get new parent
      let newParent = null;
      if (updates.parentId) {
        newParent = await prisma.resourceFolder.findFirst({
          where: {
            id: updates.parentId,
            userId,
          },
        });

        if (!newParent) {
          throw new Error('New parent folder not found or access denied');
        }
      }

      // Calculate new path and level
      const folderName = updates.name || folder.name;
      newPath = newParent ? `${newParent.path}/${folderName}` : `/${folderName}`;
      newLevel = newParent ? newParent.level + 1 : 0;
    } else if (updates.name && updates.name !== folder.name) {
      // Just name change, update path
      const pathParts = folder.path.split('/');
      pathParts[pathParts.length - 1] = updates.name;
      newPath = pathParts.join('/');
    }

    // Check for duplicate names at the new location
    if (updates.name || updates.parentId !== undefined) {
      const duplicateCheck = await prisma.resourceFolder.findFirst({
        where: {
          name: updates.name || folder.name,
          parentId: updates.parentId !== undefined ? updates.parentId : folder.parentId,
          userId,
          id: { not: folderId },
        },
      });

      if (duplicateCheck) {
        throw new Error('A folder with this name already exists at the target location');
      }
    }

    // Update the folder
    const updatedFolder = await prisma.resourceFolder.update({
      where: { id: folderId },
      data: {
        ...updates,
        path: newPath,
        level: newLevel,
      },
      include: {
        parent: true,
        children: true,
        resources: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    // Update paths of all descendant folders if path changed
    if (newPath !== folder.path) {
      await updateDescendantPaths(newPath, newLevel, userId);
    }

    // Transform null values to undefined to match our TypeScript interface
    return {
      ...updatedFolder,
      description: updatedFolder.description ?? undefined,
      color: updatedFolder.color ?? undefined,
      parentId: updatedFolder.parentId ?? undefined,
      parent: updatedFolder.parent ? {
        ...updatedFolder.parent,
        description: updatedFolder.parent.description ?? undefined,
        color: updatedFolder.parent.color ?? undefined,
        parentId: updatedFolder.parent.parentId ?? undefined,
      } : undefined,
      children: updatedFolder.children.map(child => ({
        ...child,
        description: child.description ?? undefined,
        color: child.color ?? undefined,
        parentId: child.parentId ?? undefined,
      })),
    } as ResourceFolder;
  } catch (error) {
    console.error('Error updating resource folder:', error);
    throw new Error(`Failed to update folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a resource folder
 */
export async function deleteResourceFolder(
  folderId: string,
  userId: string,
  options: {
    moveResourcesToParent?: boolean;
    deleteSubfolders?: boolean;
  } = {}
): Promise<void> {
  try {
    const { moveResourcesToParent = true, deleteSubfolders = false } = options;

    // Verify folder ownership
    const folder = await prisma.resourceFolder.findFirst({
      where: {
        id: folderId,
        userId,
      },
      include: {
        children: true,
        resources: true,
      },
    });

    if (!folder) {
      throw new Error('Folder not found or access denied');
    }

    // Check if folder has children and handle accordingly
    if (folder.children.length > 0 && !deleteSubfolders) {
      throw new Error('Cannot delete folder with subfolders. Set deleteSubfolders to true or move subfolders first.');
    }

    // Handle resources in the folder
    if (folder.resources.length > 0) {
      if (moveResourcesToParent) {
        // Move resources to parent folder
        await prisma.resource.updateMany({
          where: {
            folderId,
            userId,
          },
          data: {
            folderId: folder.parentId,
          },
        });
      } else {
        throw new Error('Cannot delete folder containing resources. Move resources first or set moveResourcesToParent to true.');
      }
    }

    // Delete subfolders if requested
    if (deleteSubfolders && folder.children.length > 0) {
      for (const child of folder.children) {
        await deleteResourceFolder(child.id, userId, options);
      }
    }

    // Delete the folder
    await prisma.resourceFolder.delete({
      where: { id: folderId },
    });
  } catch (error) {
    console.error('Error deleting resource folder:', error);
    throw new Error(`Failed to delete folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get folder tree structure
 */
export async function getFolderTree(
  userId: string,
  options: {
    includeResourceCounts?: boolean;
    maxDepth?: number;
    parentId?: string;
  } = {}
): Promise<FolderTreeNode[]> {
  try {
    const { includeResourceCounts = true, maxDepth = 10, parentId = null } = options;

    // Get folders at the specified level
    const folders = await prisma.resourceFolder.findMany({
      where: {
        userId,
        parentId,
      },
      include: {
        children: true,
        ...(includeResourceCounts && {
          resources: {
            select: { id: true },
          },
        }),
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    // Build tree structure recursively
    const tree: FolderTreeNode[] = [];
    
    for (const folder of folders) {
      const node: FolderTreeNode = {
        ...folder,
        description: folder.description ?? undefined,
        color: folder.color ?? undefined,
        parentId: folder.parentId ?? undefined,
        children: folder.level < maxDepth - 1
          ? await getFolderTree(userId, { ...options, parentId: folder.id })
          : [],
        resourceCount: includeResourceCounts ? folder.resources?.length || 0 : 0,
        totalResourceCount: 0, // Will be calculated below
      };

      // Calculate total resource count (including subfolders)
      if (includeResourceCounts) {
        node.totalResourceCount = await getTotalResourceCount(folder.id, userId);
      }

      tree.push(node);
    }

    return tree;
  } catch (error) {
    console.error('Error getting folder tree:', error);
    throw new Error(`Failed to get folder tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Move resources between folders
 */
export async function moveResources(
  resourceIds: string[],
  targetFolderId: string | null,
  userId: string
): Promise<BulkOperationResult> {
  try {
    // Verify target folder if specified
    if (targetFolderId) {
      const targetFolder = await prisma.resourceFolder.findFirst({
        where: {
          id: targetFolderId,
          userId,
        },
      });

      if (!targetFolder) {
        throw new Error('Target folder not found or access denied');
      }
    }

    // Verify resource ownership
    const resources = await prisma.resource.findMany({
      where: {
        id: { in: resourceIds },
        userId,
      },
      select: { id: true },
    });

    const validResourceIds = resources.map(r => r.id);
    const invalidResourceIds = resourceIds.filter(id => !validResourceIds.includes(id));

    // Move valid resources
    const updateResult = await prisma.resource.updateMany({
      where: {
        id: { in: validResourceIds },
        userId,
      },
      data: {
        folderId: targetFolderId,
      },
    });

    return {
      success: true,
      processedCount: updateResult.count,
      failedCount: invalidResourceIds.length,
      errors: invalidResourceIds.map(id => ({
        resourceId: id,
        error: 'Resource not found or access denied',
      })),
    };
  } catch (error) {
    console.error('Error moving resources:', error);
    throw new Error(`Failed to move resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if moving a folder would create a circular reference
 */
async function isCircularReference(
  folderId: string,
  newParentId: string,
  userId: string
): Promise<boolean> {
  try {
    let currentParentId: string | null = newParentId;
    
    while (currentParentId) {
      if (currentParentId === folderId) {
        return true;
      }
      
      const parent: { parentId: string | null } | null = await prisma.resourceFolder.findFirst({
        where: {
          id: currentParentId,
          userId,
        },
        select: { parentId: true },
      });
      
      currentParentId = parent?.parentId || null;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking circular reference:', error);
    return true; // Err on the side of caution
  }
}

/**
 * Update paths of all descendant folders
 */
async function updateDescendantPaths(
  newBasePath: string,
  newBaseLevel: number,
  userId: string
): Promise<void> {
  try {
    const descendants = await prisma.resourceFolder.findMany({
      where: {
        userId,
        path: {
          startsWith: newBasePath + '/',
        },
      },
    });

    for (const descendant of descendants) {
      const relativePath = descendant.path.substring(newBasePath.length);
      const newPath = newBasePath + relativePath;
      const newLevel = newBaseLevel + (descendant.path.split('/').length - newBasePath.split('/').length);

      await prisma.resourceFolder.update({
        where: { id: descendant.id },
        data: {
          path: newPath,
          level: newLevel,
        },
      });
    }
  } catch (error) {
    console.error('Error updating descendant paths:', error);
    throw error;
  }
}

/**
 * Get total resource count for a folder (including subfolders)
 */
async function getTotalResourceCount(folderId: string, userId: string): Promise<number> {
  try {
    const folder = await prisma.resourceFolder.findFirst({
      where: { id: folderId, userId },
      select: { path: true },
    });

    if (!folder) return 0;

    // Count resources in this folder and all subfolders
    const count = await prisma.resource.count({
      where: {
        userId,
        OR: [
          { folderId },
          {
            folder: {
              path: {
                startsWith: folder.path + '/',
              },
            },
          },
        ],
      },
    });

    return count;
  } catch (error) {
    console.error('Error getting total resource count:', error);
    return 0;
  }
}
