/**
 * Neo4j Graph Database Client Configuration for ThinkSpace
 * 
 * This file configures the Neo4j driver for graph database connections
 * optimized for the ThinkSpace PARA methodology knowledge management system.
 * Handles knowledge graph operations, relationship mapping, and graph analytics.
 */

import neo4j, { 
  Driver, 
  Session, 
  Transaction, 
  Result, 
  Record,
  auth,
  Config
} from 'neo4j-driver';

// Global variable to store the Neo4j driver instance
declare global {
  // eslint-disable-next-line no-var
  var __neo4jDriver: Driver | undefined;
}

// Neo4j connection configuration
const neo4jConfig: Config = {
  // Connection pool settings
  maxConnectionPoolSize: parseInt(process.env.NEO4J_MAX_CONNECTION_POOLSIZE || '50'),
  connectionTimeout: parseInt(process.env.NEO4J_CONNECTION_TIMEOUT || '30000'),
  maxTransactionRetryTime: parseInt(process.env.NEO4J_MAX_TRANSACTION_RETRY_TIME || '30000'),
  
  // Logging configuration
  logging: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    logger: (level, message) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Neo4j ${level.toUpperCase()}] ${message}`);
      }
    }
  },
  
  // Security settings
  encrypted: true,
  trust: 'TRUST_ALL_CERTIFICATES',
};

// Create Neo4j driver instance
const createNeo4jDriver = (): Driver => {
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME || 'neo4j';
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !password) {
    throw new Error('Neo4j connection credentials are missing. Please check your environment variables.');
  }

  return neo4j.driver(uri, auth.basic(username, password), neo4jConfig);
};

// Singleton pattern for Neo4j driver
const driver = globalThis.__neo4jDriver ?? createNeo4jDriver();

// In development, store the driver globally to prevent multiple instances
if (process.env.NODE_ENV === 'development') {
  globalThis.__neo4jDriver = driver;
}

// Connection health check function
export const checkNeo4jConnection = async (): Promise<boolean> => {
  const session = driver.session();
  try {
    const result = await session.run('RETURN 1 as test');
    const record = result.records[0];
    const testValue = record.get('test');
    
    if (testValue === 1) {
      console.log('✅ Neo4j connection successful');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Neo4j connection failed:', error);
    return false;
  } finally {
    await session.close();
  }
};

// Get a new session
export const getSession = (database?: string): Session => {
  return driver.session({ database });
};

// Execute a read query
export const executeReadQuery = async (
  cypher: string,
  parameters: any = {}
): Promise<Record[]> => {
  const session = getSession();
  try {
    const result = await session.executeRead(tx => tx.run(cypher, parameters));
    return result.records;
  } catch (error) {
    console.error('Error executing read query:', error);
    throw error;
  } finally {
    await session.close();
  }
};

// Execute a write query
export const executeWriteQuery = async (
  cypher: string,
  parameters: any = {}
): Promise<Record[]> => {
  const session = getSession();
  try {
    const result = await session.executeWrite(tx => tx.run(cypher, parameters));
    return result.records;
  } catch (error) {
    console.error('Error executing write query:', error);
    throw error;
  } finally {
    await session.close();
  }
};

// Execute multiple queries in a transaction
export const executeTransaction = async (
  queries: Array<{ cypher: string; parameters?: any }>
): Promise<Record[][]> => {
  const session = getSession();
  try {
    return await session.executeWrite(async (tx: Transaction) => {
      const results: Record[][] = [];
      for (const query of queries) {
        const result = await tx.run(query.cypher, query.parameters || {});
        results.push(result.records);
      }
      return results;
    });
  } catch (error) {
    console.error('Error executing transaction:', error);
    throw error;
  } finally {
    await session.close();
  }
};

// Get database information
export const getDatabaseInfo = async () => {
  try {
    const records = await executeReadQuery(`
      CALL dbms.components() YIELD name, versions, edition
      RETURN name, versions, edition
    `);
    return records.map(record => ({
      name: record.get('name'),
      versions: record.get('versions'),
      edition: record.get('edition')
    }));
  } catch (error) {
    console.error('Error fetching database info:', error);
    return null;
  }
};

// Get graph statistics
export const getGraphStats = async () => {
  try {
    const records = await executeReadQuery(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->()
      RETURN 
        count(DISTINCT n) as nodeCount,
        count(r) as relationshipCount,
        collect(DISTINCT labels(n)) as nodeLabels
    `);
    
    if (records.length > 0) {
      const record = records[0];
      return {
        nodeCount: record.get('nodeCount').toNumber(),
        relationshipCount: record.get('relationshipCount').toNumber(),
        nodeLabels: record.get('nodeLabels').flat()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching graph stats:', error);
    return null;
  }
};

// Graceful shutdown function
export const closeNeo4jConnection = async (): Promise<void> => {
  try {
    await driver.close();
    console.log('✅ Neo4j driver closed successfully');
  } catch (error) {
    console.error('❌ Error closing Neo4j driver:', error);
  }
};

// Export the driver instance
export default driver;

// Export Neo4j types for use throughout the application
export type { Driver, Session, Transaction, Result, Record } from 'neo4j-driver';

// Log connection status on startup
if (process.env.NODE_ENV === 'development') {
  checkNeo4jConnection().then((connected) => {
    if (connected) {
      console.log('🚀 Neo4j driver initialized successfully');
    } else {
      console.error('💥 Failed to initialize Neo4j driver');
    }
  });
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('🔄 Neo4j driver is shutting down...');
  await closeNeo4jConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Neo4j driver is shutting down...');
  await closeNeo4jConnection();
  process.exit(0);
});
