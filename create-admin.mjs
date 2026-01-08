import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/mysql2';
import { employees } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

async function createAdmin() {
  const username = 'admin';
  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);
  
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
    console.log('\nYou can now login at: https://3000-i8h4esmtbv3xyrqix3bxy-e018c72e.manus-asia.computer/login');
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('⚠️  Admin account already exists!');
      console.log('Username:', username);
      console.log('Password:', password);
    } else {
      console.error('Error:', error);
    }
  }
  
  process.exit(0);
}

createAdmin();
