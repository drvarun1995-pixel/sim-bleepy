const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFeedbackTemplates() {
  try {
    console.log('🔍 Checking feedback templates in database...')
    console.log('=' .repeat(50))
    
    // Get all templates
    const { data: templates, error } = await supabase
      .from('feedback_templates')
      .select(`
        id,
        name,
        description,
        category,
        is_system_template,
        is_active,
        usage_count,
        created_at,
        is_shared,
        users!feedback_templates_created_by_fkey (
          name,
          role
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching templates:', error)
      return
    }
    
    console.log(`📊 Total templates found: ${templates?.length || 0}`)
    console.log('=' .repeat(50))
    
    if (!templates || templates.length === 0) {
      console.log('📭 No templates found in database')
      return
    }
    
    // Display each template
    templates.forEach((template, index) => {
      console.log(`\n${index + 1}. Template: "${template.name}"`)
      console.log(`   ID: ${template.id}`)
      console.log(`   Description: ${template.description || 'No description'}`)
      console.log(`   Category: ${template.category}`)
      console.log(`   Type: ${template.is_system_template ? 'System Template' : 'User Template'}`)
      console.log(`   Status: ${template.is_active ? 'Active' : 'Inactive'}`)
      console.log(`   Shared: ${template.is_shared ? 'Yes' : 'No'}`)
      console.log(`   Usage Count: ${template.usage_count}`)
      console.log(`   Created: ${new Date(template.created_at).toLocaleString()}`)
      console.log(`   Created By: ${template.users?.name || 'Unknown'} (${template.users?.role || 'Unknown role'})`)
    })
    
    // Summary
    const systemTemplates = templates.filter(t => t.is_system_template).length
    const userTemplates = templates.filter(t => !t.is_system_template).length
    const activeTemplates = templates.filter(t => t.is_active).length
    const sharedTemplates = templates.filter(t => t.is_shared).length
    
    console.log('\n' + '=' .repeat(50))
    console.log('📈 SUMMARY:')
    console.log(`   System Templates: ${systemTemplates}`)
    console.log(`   User Templates: ${userTemplates}`)
    console.log(`   Active Templates: ${activeTemplates}`)
    console.log(`   Shared Templates: ${sharedTemplates}`)
    console.log('=' .repeat(50))
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testFeedbackTemplates()
