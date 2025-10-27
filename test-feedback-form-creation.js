// Test script to debug feedback form creation
const testData = {
  form_name: "test",
  form_template: "custom",
  anonymous_enabled: false,
  customQuestions: [
    {
      question: "test",
      type: "text",
      required: false
    }
  ],
  questions: [
    {
      question: "test",
      type: "text",
      required: false
    }
  ],
  event_ids: ["6645d5d3-452e-4fb6-abfa-1607c1b9e7dc"]
}

console.log('🧪 Testing feedback form creation with data:')
console.log(JSON.stringify(testData, null, 2))

// Simulate the backend logic
const { 
  eventId, 
  event_ids,
  form_name, 
  form_template, 
  anonymous_enabled,
  customQuestions,
  questions: questionsField
} = testData

const finalCustomQuestions = customQuestions || questionsField

console.log('\n📝 Parsed fields:')
console.log({
  eventId,
  event_ids,
  form_name,
  form_template,
  anonymous_enabled,
  customQuestions: customQuestions?.length || 0,
  questions: questionsField?.length || 0,
  finalCustomQuestions: finalCustomQuestions?.length || 0
})

console.log('\n✅ Data looks correct for database insert')
console.log('finalCustomQuestions:', finalCustomQuestions)
