
const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, '../../../doc/grammar/epic_lessons_full_report.csv');
const jsonFilePath = path.join(__dirname, 'grammar_resources.json');

// Read existing JSON to preserve book details
const existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

// Custom CSV Parser
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    // Be careful with headers that might be quoted
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];

    // Regex to split by comma, ignoring commas inside double quotes
    // This is a standard regex for CSV splitting
    const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const row = line.split(re).map(v => {
            // Remove surrounding quotes and excessive whitespace
            let val = v.trim();
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1);
            }
            // Handle double double-quotes (escaped quotes)
            return val.replace(/""/g, '"');
        });

        // Match headers
        // Note: Sometimes row length might mismatch if there are newlines in cells,
        // but for this specific epic_lessons file it should be line-based.
        const obj = {};
        // Map as much as possible, forgive trailing commas
        headers.forEach((h, index) => {
            if (index < row.length) {
                obj[h] = row[index];
            }
        });
        result.push(obj);
    }
    return result;
}

// Read and parse CSV
const csvContent = fs.readFileSync(csvFilePath, 'utf8');
const records = parseCSV(csvContent);

console.log(`Parsed ${records.length} records from CSV.`);

// Process records
const csvUrlMap = new Map();
const topicIdMap = new Map();

records.forEach(r => {
    // Only process published videos
    if (r['Status Published'] !== 'Yes') return;

    // Normalizing URL for matching
    const url = r['URL'] || '';
    if (!url) return;

    const slug = url.split('/').pop().trim();
    csvUrlMap.set(slug, r);
    csvUrlMap.set(url.trim(), r);

    const topicId = r['Grammar Topic ID'];
    if (topicId) {
        if (!topicIdMap.has(topicId)) {
            topicIdMap.set(topicId, []);
        }
        topicIdMap.get(topicId).push(r);
    }
});

const newGrammarResources = {};
let matchCount = 0;

Object.keys(existingData).forEach(key => {
    const item = existingData[key];
    const newEntry = {
        bookDetails: item.bookDetails,
        videos: []
    };

    let found = false;
    if (item.videoUrl) {
        // Find the topic ID from the current videoUrl
        let slug = item.videoUrl.split('/').pop().trim();
        let record = csvUrlMap.get(slug) || csvUrlMap.get(item.videoUrl.trim());

        if (record) {
            found = true;
            matchCount++;
            const topicId = record['Grammar Topic ID'];

            // Get all videos for this topic
            const allVideos = topicIdMap.get(topicId) || [];

            // Map to simplified object
            newEntry.videos = allVideos.map(v => ({
                title: v['Lesson Name'],
                url: v['URL'],
                level: v['English Level'] ? parseInt(v['English Level'], 10) : 0
            }));

            // Sort videos by level? Optional, but nice.
            newEntry.videos.sort((a, b) => a.level - b.level);

        } else {
            console.log(`Warning: Could not find CSV record for key "${key}" with URL: ${item.videoUrl}`);
        }
    }

    if (!found) {
        // Fallback: keep the original as a single entry
        if (item.videoUrl) {
            newEntry.videos.push({
                title: item.videoTitle || 'Video Lesson',
                url: item.videoUrl,
                level: 0 // Unknown
            });
        }
    }

    newGrammarResources[key] = newEntry;
});

// Write result
fs.writeFileSync(jsonFilePath, JSON.stringify(newGrammarResources, null, 2));
console.log(`Successfully updated grammar_resources.json with ${matchCount} topic matches.`);
