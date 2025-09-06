// Test script to debug the Remotion API
const testData = {
  characters: [
    { id: "1", name: "Alex", color: "bg-primary" },
    { id: "2", name: "Sam", color: "bg-secondary" }
  ],
  messages: [
    { id: "1", characterId: "1", text: "Hello", timestamp: 1 },
    { id: "2", characterId: "2", text: "Hi there!", timestamp: 2 }
  ],
  isPro: false
};

fetch('/api/generate-video', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('Response status:', response.status);
  console.log('Response headers:', response.headers);
  
  if (!response.ok) {
    return response.json().then(error => {
      console.error('API Error:', error);
      throw new Error(error.details || error.error || 'Unknown error');
    });
  }
  
  return response.blob();
})
.then(blob => {
  console.log('Video blob size:', blob.size);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'test-video.mp4';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('Video download completed');
})
.catch(error => {
  console.error('Test failed:', error);
});
