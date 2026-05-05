import fs from 'fs';
import path from 'path';
import axios from 'axios';

async function fetchWithRetry(url: string, body: any, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.post(url, body);
      return res.data;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function fetchIndiaData() {
  console.log("Fetching Indian states from countriesnow.space API...");
  
  try {
    const statesData = await fetchWithRetry("https://countriesnow.space/api/v0.1/countries/states", {
      country: "India"
    });
    
    if (statesData.error || !statesData.data?.states) {
      throw new Error("Invalid states response format");
    }
    
    const states = statesData.data.states;
    console.log(`Found ${states.length} states/UTs. Fetching cities for each...`);
    
    const result: Record<string, { name: string; cities: string[] }> = {};
    
    // Sort states alphabetically by name to present them nicely in the dropdown later
    states.sort((a: any, b: any) => a.name.localeCompare(b.name));
    
    for (const state of states) {
      console.log(`Fetching cities for ${state.name} (${state.state_code})...`);
      try {
        const citiesData = await fetchWithRetry("https://countriesnow.space/api/v0.1/countries/state/cities", {
          country: "India",
          state: state.name
        });
        
        let cities = [];
        if (!citiesData.error && Array.isArray(citiesData.data)) {
          cities = citiesData.data;
        } else {
          console.warn(`Warning: Could not get cities for ${state.name}`);
        }
        
        result[state.state_code || state.name.substring(0, 2).toUpperCase()] = {
          name: state.name,
          cities: cities.sort(),
        };
        
        // Sleep to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (err) {
        console.warn(`Error fetching cities for ${state.name}:`, (err as any).message);
        result[state.state_code || state.name.substring(0, 2).toUpperCase()] = {
          name: state.name,
          cities: [],
        };
      }
    }
    
    const outputPath = path.join(process.cwd(), 'public', 'india-data.json');
    // Ensure public directory exists
    const publicDir = path.dirname(outputPath);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
    console.log(`\nSuccess! Saved data for ${Object.keys(result).length} states to ${outputPath}`);
    
  } catch (err) {
    console.error("Failed to fetch India data completely:", err);
    process.exit(1);
  }
}

fetchIndiaData();
