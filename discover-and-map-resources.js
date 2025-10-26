// ============================================================================
// DISCOVER AND MAP EXISTING RESOURCES FROM STORAGE
// ============================================================================
// This script helps you discover files in your Supabase storage bucket
// and generate SQL statements to map them to the database

// Run this in your browser console on the Supabase dashboard or in a Node.js script

// ============================================================================
// STEP 1: DISCOVER FILES IN STORAGE
// ============================================================================

async function discoverStorageFiles() {
    try {
        // This would be run in Supabase SQL Editor
        const query = `
            SELECT 
                name,
                path_tokens,
                metadata->>'size' as file_size,
                metadata->>'mimetype' as mime_type,
                created_at,
                updated_at
            FROM storage.objects 
            WHERE bucket_id = 'resources'
            ORDER BY name;
        `;
        
        console.log('Run this query in Supabase SQL Editor:');
        console.log(query);
        console.log('\nCopy the results and use them in the mapping function below.');
        
    } catch (error) {
        console.error('Error discovering files:', error);
    }
}

// ============================================================================
// STEP 2: GENERATE MAPPING SQL
// ============================================================================

function generateMappingSQL(storageFiles) {
    // Example storage files data (replace with your actual data)
    const exampleFiles = [
        {
            name: 'grand-rounds-2024-01.pdf',
            path_tokens: ['grand-round', 'grand-rounds-2024-01.pdf'],
            file_size: '2048000',
            mime_type: 'application/pdf',
            created_at: '2024-01-15T10:00:00Z'
        },
        {
            name: 'clinical-skills-guide.pdf',
            path_tokens: ['clinical-skills', 'clinical-skills-guide.pdf'],
            file_size: '1536000',
            mime_type: 'application/pdf',
            created_at: '2024-01-10T14:30:00Z'
        },
        {
            name: 'bedside-teaching-video.mp4',
            path_tokens: ['bedside-teaching', 'bedside-teaching-video.mp4'],
            file_size: '52428800',
            mime_type: 'video/mp4',
            created_at: '2024-01-12T09:15:00Z'
        }
    ];
    
    // Use your actual data or the example data
    const files = storageFiles || exampleFiles;
    
    console.log('-- Generated SQL for mapping existing resources:');
    console.log('-- Copy and paste this into Supabase SQL Editor\n');
    
    let sql = 'INSERT INTO public.resources (\n';
    sql += '    title, description, category, file_name, file_path, file_url, file_size, file_type, uploaded_by_name, is_active\n';
    sql += ') VALUES\n';
    
    const values = files.map((file, index) => {
        const category = file.path_tokens[0] || 'others';
        const fileName = file.name;
        const filePath = file.path_tokens.join('/');
        const fileSize = parseInt(file.file_size) || 0;
        const mimeType = file.mime_type || getMimeTypeFromExtension(fileName);
        const uploadedBy = 'Admin User'; // Change this to the actual uploader
        
        // Generate a title from the filename
        const title = generateTitleFromFileName(fileName);
        
        // Generate a description
        const description = generateDescriptionFromCategory(category);
        
        const value = `    ('${title}', '${description}', '${category}', '${fileName}', '${filePath}', 'https://your-supabase-url.supabase.co/storage/v1/object/public/resources/${filePath}', ${fileSize}, '${mimeType}', '${uploadedBy}', true)`;
        
        return value;
    });
    
    sql += values.join(',\n');
    sql += ';\n';
    
    console.log(sql);
    
    return sql;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMimeTypeFromExtension(fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'txt': 'text/plain',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'mp4': 'video/mp4',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'zip': 'application/zip'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
}

function generateTitleFromFileName(fileName) {
    // Remove extension and convert to title case
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    return nameWithoutExt
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function generateDescriptionFromCategory(category) {
    const descriptions = {
        'bedside-teaching': 'Bedside teaching materials and resources',
        'clinical-skills': 'Clinical skills guides and practice materials',
        'core-teachings': 'Core teaching materials and resources',
        'exams-mocks': 'Exam preparation and mock test materials',
        'grand-round': 'Grand rounds presentations and materials',
        'hub-days': 'Hub day materials and resources',
        'inductions': 'Induction and orientation materials',
        'obs-gynae-practice-sessions': 'Obstetrics and gynecology practice materials',
        'osce-revision': 'OSCE revision materials and guides',
        'others': 'Miscellaneous teaching materials',
        'paeds-practice-sessions': 'Pediatrics practice materials',
        'pharmacy-teaching': 'Pharmacy teaching resources',
        'portfolio-drop-ins': 'Portfolio and drop-in session materials',
        'twilight-teaching': 'Twilight teaching session materials',
        'video-teaching': 'Video-based teaching materials'
    };
    
    return descriptions[category] || 'Teaching material';
}

// ============================================================================
// STEP 3: CATEGORY MAPPING HELPER
// ============================================================================

function mapCategoryFromPath(pathTokens) {
    const category = pathTokens[0];
    const validCategories = [
        'bedside-teaching',
        'clinical-skills',
        'core-teachings',
        'exams-mocks',
        'grand-round',
        'hub-days',
        'inductions',
        'obs-gynae-practice-sessions',
        'osce-revision',
        'others',
        'paeds-practice-sessions',
        'pharmacy-teaching',
        'portfolio-drop-ins',
        'twilight-teaching',
        'video-teaching'
    ];
    
    return validCategories.includes(category) ? category : 'others';
}

// ============================================================================
// STEP 4: USAGE INSTRUCTIONS
// ============================================================================

function showUsageInstructions() {
    console.log(`
============================================================================
USAGE INSTRUCTIONS
============================================================================

1. DISCOVER FILES:
   - Go to Supabase Dashboard → SQL Editor
   - Run the query from discoverStorageFiles()
   - Copy the results

2. GENERATE MAPPING SQL:
   - Replace the example data in generateMappingSQL() with your actual data
   - Run generateMappingSQL(yourActualData)
   - Copy the generated SQL

3. EXECUTE MAPPING:
   - Go to Supabase Dashboard → SQL Editor
   - Paste and run the generated SQL
   - Verify with: SELECT * FROM public.resources;

4. CUSTOMIZE:
   - Edit titles and descriptions as needed
   - Update uploaded_by_name to actual uploaders
   - Link to events if needed

============================================================================
    `);
}

// ============================================================================
// RUN THE SCRIPT
// ============================================================================

// Uncomment the functions you want to run:

// discoverStorageFiles();
// generateMappingSQL();
// showUsageInstructions();

console.log('Resources mapping script loaded. Run the functions above to get started.');
