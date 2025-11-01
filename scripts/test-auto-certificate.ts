import { writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateCertificateImage } from '../lib/certificate-generator'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const backgroundImage = process.env.TEST_TEMPLATE_SIGNED_URL
  if (!backgroundImage) {
    throw new Error('Set TEST_TEMPLATE_SIGNED_URL env var to the signed URL of the template image')
  }

  const template = {
    id: 'template-1761850115302',
    name: 'Test Template',
    backgroundImage,
    fields: [
      {
        id: 'field-1761850102372',
        text: 'Dr. John Smith',
        x: 293,
        y: 256,
        width: 200,
        height: 30,
        fontSize: 16,
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'normal',
        textAlign: 'center',
        dataSource: 'attendee.name'
      }
    ],
    canvasSize: { width: 800, height: 565 }
  }

  const certificateData = {
    attendee_name: 'Dr. Varun',
    attendee_email: 'drvarun1995@gmail.com',
    attendee_university: 'UCL',
    attendee_role: 'admin',
    event_title: 'Demo event',
    event_description: '',
    event_date: '31 October 2025',
    event_start_time: '23:22:00',
    event_startTime: '23:22:00',
    event_end_time: '23:23:00',
    event_endTime: '23:23:00',
    event_time_notes: '',
    event_timeNotes: '',
    event_location: 'Online',
    event_duration: '23:22:00 - 23:23:00',
    event_organizer: 'Unknown Organizer',
    event_category: 'c03cd73d-6143-46d1-9a58-11086e1286d2',
    event_format: '77695685-d796-43ba-9a77-9567415f34f0',
    event_link: '',
    event_eventLink: '',
    event_status: 'published',
    event_owner_name: 'Unknown Organizer',
    certificate_date: '1 November 2025',
    certificate_id: 'CERT-MHFL9ZWR-X3LTNB',
    generator_name: 'Auto_Generator'
  }

  const storagePath = await generateCertificateImage(template as any, certificateData)
  console.log('Generated storage path:', storagePath)

  if (storagePath) {
    console.log('File written to Supabase storage at:', storagePath)
  } else {
    console.error('generateCertificateImage returned null')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})


