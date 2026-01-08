import { hashPassword } from '../server/auth';
import { createEmployee, createSymptom } from '../server/db';

async function main() {
  console.log('Creating test data...\n');
  
  // Create employee account
  try {
    const passwordHash = await hashPassword('employee123');
    await createEmployee({
      username: 'employee1',
      passwordHash,
      name: 'Test Employee',
      role: 'employee',
    });
    console.log('✅ Employee account created!');
    console.log('   Username: employee1');
    console.log('   Password: employee123\n');
  } catch (error: any) {
    if (error.message?.includes('Duplicate')) {
      console.log('⚠️  Employee account already exists!');
      console.log('   Username: employee1');
      console.log('   Password: employee123\n');
    } else {
      console.error('Error creating employee:', error);
    }
  }
  
  // Create sample symptoms
  const symptoms = [
    { name: '头痛', longText: '头痛是指头部疼痛的症状，可能由多种原因引起，包括紧张性头痛、偏头痛、丛集性头痛等。', displayOrder: 1 },
    { name: '发烧', longText: '发烧是指体温升高超过正常范围的症状，通常是身体对感染或其他疾病的反应。', displayOrder: 2 },
    { name: '咳嗽', longText: '咳嗽是呼吸道受刺激时的保护性反射动作，可能是急性或慢性的。', displayOrder: 3 },
    { name: '疲劳', longText: '疲劳是指身体或精神上的极度疲倦感，可能由多种原因引起。', displayOrder: 4 },
    { name: '失眠', longText: '失眠是指难以入睡或保持睡眠的状态，会影响日常生活质量。', displayOrder: 5 },
  ];
  
  console.log('Creating sample symptoms...');
  for (const symptom of symptoms) {
    try {
      await createSymptom(symptom);
      console.log(`✅ Created symptom: ${symptom.name}`);
    } catch (error: any) {
      if (error.message?.includes('Duplicate')) {
        console.log(`⚠️  Symptom already exists: ${symptom.name}`);
      } else {
        console.error(`Error creating symptom ${symptom.name}:`, error);
      }
    }
  }
  
  console.log('\n✅ Test data setup complete!');
  console.log('\nYou can now:');
  console.log('1. Login as employee at: https://3000-i8h4esmtbv3xyrqix3bxy-e018c72e.manus-asia.computer/login');
  console.log('2. Create a report by pasting: 头痛, 发烧, 咳嗽');
}

main();
