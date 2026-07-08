async function testJudge0Status() {
  const url = 'https://api.status.judge0.com/submissions?wait=true';
  try {
    console.log(`Testing Judge0 Status: ${url}`);
    const payload = {
      source_code: "print('Hello from Judge0 Status!')",
      language_id: 71 // Python 3
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Success for Judge0 Status:`, JSON.stringify(data));
      return true;
    } else {
      console.log(`❌ HTTP Error ${res.status} for Judge0 Status`);
    }
  } catch (err) {
    console.log(`❌ Failed for Judge0 Status: ${err.message}`);
  }
  return false;
}

testJudge0Status();
