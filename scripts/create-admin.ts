import { hashPassword } from '../server/auth';
import { createEmployee } from '../server/db';

async function main() {
  const username = 'admin';
  const password = 'admin123';
  
  try {
    const passwordHash = await hashPassword(password);
    await createEmployee({
      username,
      passwordHash,
      name: 'Administrator',
      role: 'admin',
    });
    
    console.log('✅ Admin account created successfully!');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('\nLogin URL: https://3000-i8h4esmtbv3xyrqix3bxy-e018c72e.manus-asia.computer/login');
  } catch (error: any) {
    if (error.message?.includes('Duplicate')) {
      console.log('⚠️  Admin account already exists!');
      console.log('Username:', username);
      console.log('Password:', password);
      console.log('\nLogin URL: https://3000-i8h4esmtbv3xyrqix3bxy-e018c72e.manus-asia.computer/login');
    } else {
      console.error('Error:', error);
    }
  }
}

main();
