import fs from 'fs';

async function run() {
  const email = 'mr1875413@gmail.com';
  const url = `http://localhost:3000/api/lms/study-map?email=${encodeURIComponent(email)}`;
  console.log("Fetching URL:", url);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("HTTP Error:", res.status, res.statusText);
      const text = await res.text();
      console.log("Response body:", text);
      return;
    }
    const json = await res.json();
    console.log("Status: OK");
    console.log("Errors returned from API:", json.errors);
    console.log("Data keys:", Object.keys(json.data || {}));
    if (json.data) {
      console.log("Profile:", json.data.profile ? "Found (ID: " + json.data.profile.id + ")" : "Not Found");
      console.log("Categories Count:", json.data.categories?.length);
      console.log("Levels Count:", json.data.levels?.length);
      console.log("Chapters Count:", json.data.chapters?.length);
      console.log("Materials Count:", json.data.materials?.length);
      console.log("CompletedMaterialIds Count:", json.data.completedMaterialIds?.length);
      console.log("Progress Count:", json.data.progress?.length);
      console.log("Weekly Targets Count:", json.data.weeklyTargets?.length);
      console.log("Quiz Access Count:", json.data.quizAccess?.length);
      console.log("dbMaterialsCount:", json.data.dbMaterialsCount);
    }
    const payloadStr = JSON.stringify(json);
    console.log("JSON Payload Size:", (payloadStr.length / 1024).toFixed(2) + " KB");
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

run();
