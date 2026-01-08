import bcryptjs from 'bcryptjs';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { employees } from './drizzle/schema.js';

async function createAdmin() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);
  
  const username = 'admin';
  const password = 'admin123';
  const passwordHash = await bcryptjs.hash(password, 10);
  
  try {
    await db.insert(employees).values({
      username,
      passwordHash,
      name: 'Administrator',
      role: 'admin',
    });
    
    console.log('✅ Admin account created successfully!');
    console.log('Username:', username);
    console.log('Password:', password);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('⚠️  Admin account already exists!');
      console.log('Username:', username);
      console.log('Password:', password);
    } else {
      console.error('Error:', error);
    }
  }
  
  await connection.end();
  process.exit(0);
}

createAdmin();
