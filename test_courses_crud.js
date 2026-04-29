const API_BASE = 'http://localhost:3000/api/courses';

async function testCoursesCRUD() {
  console.log('--- STARTING COURSES CRUD TEST ---');
  let testCourseId = null;

  try {
    // 1. CREATE
    const createPayload = {
      code: 'TEST-101',
      name: 'Sample Test Course',
      description: 'Validation testing course',
      level: 'PPL',
      durationHours: 60,
      price: 150000.00
    };
    console.log('\n[POST] Creating new course...', createPayload);
    
    let res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createPayload)
    });
    
    let data = await res.json();
    if (!res.ok) throw new Error(`Create failed: ${JSON.stringify(data)}`);
    console.log('✅ Create Success! Created Course ID:', data.id);
    testCourseId = data.id;

    // 2. READ (List)
    console.log('\n[GET] Fetching courses list...');
    res = await fetch(API_BASE);
    data = await res.json();
    if (!res.ok) throw new Error(`List failed: ${JSON.stringify(data)}`);
    
    const found = data.find(c => c.id === testCourseId);
    if (!found) throw new Error('Created course not found in list!');
    console.log(`✅ Read Success! Found course TEST-101 in list. Total courses: ${data.length}`);

    // 3. UPDATE
    const updatePayload = {
      price: 175000.00,
      durationHours: 65,
      name: 'Updated Sample Test Course'
    };
    console.log('\n[PUT] Updating course...', updatePayload);
    res = await fetch(`${API_BASE}/${testCourseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });
    data = await res.json();
    if (!res.ok) throw new Error(`Update failed: ${JSON.stringify(data)}`);
    if (parseFloat(data.price) !== 175000) throw new Error('Price was not updated correctly. Got: ' + data.price);
    console.log('✅ Update Success! New Name:', data.name, 'New Price:', data.price);

    // 4. SOFT DELETE / DEACTIVATE
    console.log('\n[DELETE] Deactivating course...');
    res = await fetch(`${API_BASE}/${testCourseId}`, {
      method: 'DELETE'
    });
    data = await res.json();
    if (!res.ok) throw new Error(`Deactivate failed: ${JSON.stringify(data)}`);
    console.log('✅ Deactivate Success! IsActive status:', data.course?.isActive ?? false);

    // 5. HARD DELETE
    console.log('\n[DELETE] Hard deleting course...');
    res = await fetch(`${API_BASE}/${testCourseId}/hard`, {
      method: 'DELETE'
    });
    data = await res.json();
    if (!res.ok) throw new Error(`Hard Delete failed: ${JSON.stringify(data)}`);
    console.log('✅ Hard Delete Success!');

    console.log('\n🎉 ALL CRUD OPERATIONS COMPLETED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

testCoursesCRUD();
