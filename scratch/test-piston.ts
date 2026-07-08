async function testEndpoint(url: string) {
  try {
    console.log(`Testing endpoint: ${url}`);
    const payload = {
      language: 'python',
      version: '*',
      files: [{ content: "print('Hello from test!')" }]
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Success for ${url}:`, JSON.stringify(data));
    } else {
      console.log(`❌ HTTP Error ${res.status} for ${url}`);
    }
  } catch (err: any) {
    console.log(`❌ Failed for ${url}: ${err.message}`);
  }
}

async function run() {
  const endpoints = [
    'https://emkc.org/api/v2/piston/execute',
    'https://piston.deno.dev/api/v2/execute',
    'https://piston-runtimes.deno.dev/api/v2/execute',
  ];
  for (const url of endpoints) {
    await testEndpoint(url);
  }
}

run();
