/**
 * Sub-Interest Utility Functions for ThinkSpace Areas
 *
 * Utility functions for managing hierarchical sub-interests,
 * including tree building, validation, and operations.
 */

import type {
  SubInterestWithBasic,
  SubInterestTreeNode,
  SubInterestMetrics,
  CreateSubInterestData,
  UpdateSubInterestData,
} from '@/types/sub-interest';

/**
 * Build a hierarchical tree structure from flat sub-interest array
 */
export function buildSubInterestTree(
  subInterests: SubInterestWithBasic[]
): SubInterestTreeNode[] {
  const nodeMap = new Map<string, SubInterestTreeNode>();
  const rootNodes: SubInterestTreeNode[] = [];

  // First pass: create all nodes
  subInterests.forEach(subInterest => {
    const node: SubInterestTreeNode = {
      ...subInterest,
      children: [],
      expanded: false,
      selected: false,
    };
    nodeMap.set(subInterest.id, node);
  });

  // Second pass: build hierarchy
  subInterests.forEach(subInterest => {
    const node = nodeMap.get(subInterest.id)!;
    
    if (subInterest.parentId) {
      const parent = nodeMap.get(subInterest.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found, treat as root
        rootNodes.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  });

  // Sort children at each level
  const sortChildren = (nodes: SubInterestTreeNode[]) => {
    nodes.sort((a, b) => a.title.localeCompare(b.title));
    nodes.forEach(node => sortChildren(node.children));
  };

  sortChildren(rootNodes);
  return rootNodes;
}

/**
 * Flatten a tree structure back to a flat array
 */
export function flattenSubInterestTree(
  tree: SubInterestTreeNode[]
): SubInterestWithBasic[] {
  const result: SubInterestWithBasic[] = [];
  
  const traverse = (nodes: SubInterestTreeNode[]) => {
    nodes.forEach(node => {
      const { children, expanded, selected, ...subInterest } = node;
      result.push(subInterest);
      traverse(children);
    });
  };
  
  traverse(tree);
  return result;
}

/**
 * Find a sub-interest node in the tree by ID
 */
export function findSubInterestInTree(
  tree: SubInterestTreeNode[],
  id: string
): SubInterestTreeNode | null {
  for (const node of tree) {
    if (node.id === id) {
      return node;
    }
    const found = findSubInterestInTree(node.children, id);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * Get all ancestors of a sub-interest
 */
export function getSubInterestAncestors(
  subInterests: SubInterestWithBasic[],
  subInterestId: string
): SubInterestWithBasic[] {
  const ancestors: SubInterestWithBasic[] = [];
  const subInterestMap = new Map(subInterests.map(si => [si.id, si]));
  
  let current = subInterestMap.get(subInterestId);
  while (current?.parentId) {
    const parent = subInterestMap.get(current.parentId);
    if (parent) {
      ancestors.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }
  
  return ancestors;
}

/**
 * Get all descendants of a sub-interest
 */
export function getSubInterestDescendants(
  subInterests: SubInterestWithBasic[],
  subInterestId: string
): SubInterestWithBasic[] {
  const descendants: SubInterestWithBasic[] = [];
  const children = subInterests.filter(si => si.parentId === subInterestId);
  
  children.forEach(child => {
    descendants.push(child);
    descendants.push(...getSubInterestDescendants(subInterests, child.id));
  });
  
  return descendants;
}

/**
 * Calculate metrics for sub-interests
 */
export function calculateSubInterestMetrics(
  subInterests: SubInterestWithBasic[]
): SubInterestMetrics {
  const totalCount = subInterests.length;
  const depths = subInterests.map(si => si.level);
  const maxDepth = Math.max(...depths, 0);
  const averageDepth = depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 0;
  
  const contentDistribution = subInterests.reduce(
    (acc, si) => ({
      projects: acc.projects + si._count.projects,
      resources: acc.resources + si._count.resources,
      notes: acc.notes + si._count.notes_rel,
    }),
    { projects: 0, resources: 0, notes: 0 }
  );
  
  const connectionStrength = subInterests.reduce(
    (acc, si) => ({
      internal: acc.internal + si._count.relatedSubInterests,
      external: acc.external + (si._count.referencedBy || 0),
    }),
    { internal: 0, external: 0 }
  );
  
  return {
    totalCount,
    maxDepth,
    averageDepth,
    contentDistribution,
    connectionStrength,
  };
}

/**
 * Validate sub-interest data
 */
export function validateSubInterestData(
  data: CreateSubInterestData | UpdateSubInterestData,
  existingSubInterests?: SubInterestWithBasic[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Title validation
  if ('title' in data && data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (data.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }
  }
  
  // Description validation
  if (data.description && data.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }
  
  // Notes validation
  if (data.notes && data.notes.length > 5000) {
    errors.push('Notes must be less than 5000 characters');
  }
  
  // Observations validation
  if (data.observations && data.observations.length > 5000) {
    errors.push('Observations must be less than 5000 characters');
  }
  
  // Parent validation (prevent circular references)
  if (data.parentId && existingSubInterests) {
    const parentChain = new Set<string>();
    let currentParentId = data.parentId;
    
    while (currentParentId) {
      if (parentChain.has(currentParentId)) {
        errors.push('Circular reference detected in parent hierarchy');
        break;
      }
      parentChain.add(currentParentId);
      
      const parent = existingSubInterests.find(si => si.id === currentParentId);
      currentParentId = parent?.parentId || "";
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate breadcrumb path for a sub-interest
 */
export function generateSubInterestBreadcrumb(
  subInterests: SubInterestWithBasic[],
  subInterestId: string
): Array<{ id: string; title: string }> {
  const ancestors = getSubInterestAncestors(subInterests, subInterestId);
  const current = subInterests.find(si => si.id === subInterestId);
  
  const breadcrumb = ancestors.map(ancestor => ({
    id: ancestor.id,
    title: ancestor.title,
  }));
  
  if (current) {
    breadcrumb.push({
      id: current.id,
      title: current.title,
    });
  }
  
  return breadcrumb;
}

/**
 * Search sub-interests with fuzzy matching
 */
export function searchSubInterests(
  subInterests: SubInterestWithBasic[],
  query: string
): SubInterestWithBasic[] {
  if (!query.trim()) {
    return subInterests;
  }
  
  const searchTerm = query.toLowerCase().trim();
  
  return subInterests.filter(subInterest => {
    const titleMatch = subInterest.title.toLowerCase().includes(searchTerm);
    const descriptionMatch = subInterest.description?.toLowerCase().includes(searchTerm);
    const notesMatch = subInterest.notes?.toLowerCase().includes(searchTerm);
    const tagsMatch = subInterest.tags.some(tag => 
      tag.toLowerCase().includes(searchTerm)
    );
    
    return titleMatch || descriptionMatch || notesMatch || tagsMatch;
  });
}

/**
 * Sort sub-interests by various criteria
 */
export function sortSubInterests(
  subInterests: SubInterestWithBasic[],
  sortBy: 'title' | 'level' | 'created' | 'updated' | 'contentCount',
  order: 'asc' | 'desc' = 'asc'
): SubInterestWithBasic[] {
  const sorted = [...subInterests].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'level':
        comparison = a.level - b.level;
        break;
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updated':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'contentCount':
        const aCount = a._count.projects + a._count.resources + a._count.notes_rel;
        const bCount = b._count.projects + b._count.resources + b._count.notes_rel;
        comparison = aCount - bCount;
        break;
    }
    
    return order === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
}

/**
 * Export sub-interests to various formats
 */
export function exportSubInterests(
  subInterests: SubInterestWithBasic[],
  format: 'json' | 'csv' | 'markdown'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(subInterests, null, 2);
      
    case 'csv':
      const headers = ['ID', 'Title', 'Description', 'Level', 'Parent ID', 'Tags', 'Created', 'Updated'];
      const rows = subInterests.map(si => [
        si.id,
        si.title,
        si.description || '',
        si.level.toString(),
        si.parentId || '',
        si.tags.join(';'),
        si.createdAt.toString(),
        si.updatedAt.toString(),
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
      
    case 'markdown':
      const tree = buildSubInterestTree(subInterests);
      
      const renderNode = (node: SubInterestTreeNode, depth = 0): string => {
        const indent = '  '.repeat(depth);
        let result = `${indent}- **${node.title}**`;
        
        if (node.description) {
          result += `: ${node.description}`;
        }
        
        if (node.tags.length > 0) {
          result += ` (${node.tags.join(', ')})`;
        }
        
        result += '\n';
        
        node.children.forEach(child => {
          result += renderNode(child, depth + 1);
        });
        
        return result;
      };
      
      return tree.map(node => renderNode(node)).join('\n');
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
