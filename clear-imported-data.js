#!/usr/bin/env node

/**
 * CLEAR IMPORTED DATA SCRIPT
 * 
 * This script clears all imported data from the database:
 * - Events
 * - Categories
 * - Formats
 * - Locations
 * - Organizers
 * - Speakers
 * - Event-Speaker relationships
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearImportedData() {
    console.log('🗑️ Clearing all imported data...\n');
    
    try {
        // Clear event-speaker relationships first (foreign key constraints)
        console.log('1️⃣ Clearing event-speaker relationships...');
        const { error: eventSpeakerError } = await supabase
            .from('event_speakers')
            .delete()
            .neq('event_id', '00000000-0000-0000-0000-000000000000');
        
        if (eventSpeakerError) {
            console.error('❌ Error clearing event-speaker relationships:', eventSpeakerError.message);
        } else {
            console.log('✅ Event-speaker relationships cleared');
        }
        
        // Clear events
        console.log('\n2️⃣ Clearing events...');
        const { error: eventsError } = await supabase
            .from('events')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (eventsError) {
            console.error('❌ Error clearing events:', eventsError.message);
        } else {
            console.log('✅ Events cleared');
        }
        
        // Clear categories
        console.log('\n3️⃣ Clearing categories...');
        const { error: categoriesError } = await supabase
            .from('categories')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (categoriesError) {
            console.error('❌ Error clearing categories:', categoriesError.message);
        } else {
            console.log('✅ Categories cleared');
        }
        
        // Clear formats
        console.log('\n4️⃣ Clearing formats...');
        const { error: formatsError } = await supabase
            .from('formats')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (formatsError) {
            console.error('❌ Error clearing formats:', formatsError.message);
        } else {
            console.log('✅ Formats cleared');
        }
        
        // Clear locations
        console.log('\n5️⃣ Clearing locations...');
        const { error: locationsError } = await supabase
            .from('locations')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (locationsError) {
            console.error('❌ Error clearing locations:', locationsError.message);
        } else {
            console.log('✅ Locations cleared');
        }
        
        // Clear organizers
        console.log('\n6️⃣ Clearing organizers...');
        const { error: organizersError } = await supabase
            .from('organizers')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (organizersError) {
            console.error('❌ Error clearing organizers:', organizersError.message);
        } else {
            console.log('✅ Organizers cleared');
        }
        
        // Clear speakers
        console.log('\n7️⃣ Clearing speakers...');
        const { error: speakersError } = await supabase
            .from('speakers')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (speakersError) {
            console.error('❌ Error clearing speakers:', speakersError.message);
        } else {
            console.log('✅ Speakers cleared');
        }
        
        console.log('\n🎉 All imported data has been cleared successfully!');
        console.log('\n📊 Database is now clean and ready for fresh imports.');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

// Run the cleanup
clearImportedData().catch(console.error);
