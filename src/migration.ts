// src/migration.ts
import mongoose from 'mongoose';
import { Dowry } from './models/dowry.model';

// URL pattern to find links in text
const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;

// Function to extract URLs from text
function extractUrls(text: string): string[] {
    if (!text) return [];
    
    const urls = text.match(urlRegex);
    return urls ? urls.map(url => {
        // Add protocol if missing
        if (!url.startsWith('http')) {
            return 'https://' + url;
        }
        return url;
    }) : [];
}

async function migrateDowryUrls(): Promise<void> {
    try {
        console.log('🚀 Starting Dowry URL Migration...');
        
        // Get all dowries
        const dowries = await Dowry.find({});
        console.log(`📊 Found ${dowries.length} dowries to process`);
        
        let processedCount = 0;
        let updatedCount = 0;
        
        for (const dowry of dowries) {
            console.log(`\n🔍 Processing dowry: ${dowry.name} (ID: ${dowry._id})`);
            
            let hasChanges = false;
            const updateData: any = {};
            
            // Check description for URLs
            if (dowry.description) {
                const descriptionUrls = extractUrls(dowry.description);
                if (descriptionUrls.length > 0) {
                    console.log(`  📝 Found ${descriptionUrls.length} URL(s) in description`);
                    console.log(`  🔗 URLs: ${descriptionUrls.join(', ')}`);
                    
                    // If dowry doesn't have URL yet, use the first one
                    if (!dowry.url && descriptionUrls.length > 0) {
                        updateData.url = descriptionUrls[0];
                        console.log(`  ✅ Setting URL: ${updateData.url}`);
                        hasChanges = true;
                    }
                }
            }
            
            // Check location for URLs
            if (dowry.dowryLocation) {
                const locationUrls = extractUrls(dowry.dowryLocation);
                if (locationUrls.length > 0) {
                    console.log(`  📍 Found ${locationUrls.length} URL(s) in location`);
                    console.log(`  🔗 URLs: ${locationUrls.join(', ')}`);
                    
                    // If dowry doesn't have URL yet, use the first one
                    if (!dowry.url && locationUrls.length > 0) {
                        updateData.url = locationUrls[0];
                        console.log(`  ✅ Setting URL: ${updateData.url}`);
                        hasChanges = true;
                    }
                }
            }
            
            // Update dowry if changes were made
            if (hasChanges) {
                await Dowry.findByIdAndUpdate(dowry._id, updateData);
                console.log(`  ✅ Updated dowry ${dowry._id}`);
                updatedCount++;
            } else {
                console.log(`  ⏭️  No URLs found or URL already exists, skipping`);
            }
            
            processedCount++;
        }
        
        console.log(`\n🎉 Migration completed!`);
        console.log(`📊 Processed: ${processedCount} dowries`);
        console.log(`✅ Updated: ${updatedCount} dowries`);
        console.log(`⏭️  Skipped: ${processedCount - updatedCount} dowries`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run migration
migrateDowryUrls();