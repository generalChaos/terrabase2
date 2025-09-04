const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateImageAnalysisPrompt() {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .update({
        content: `Analyze this image and return ONLY JSON with this exact schema:

{
  "analysis": "2–3 sentences describing what you see."
}

Rules:
- No extra keys. No preamble. No markdown. Only JSON.`
      })
      .eq('name', 'image_analysis')
      .select();

    if (error) {
      console.error('Error updating prompt:', error);
    } else {
      console.log('Successfully updated image_analysis prompt:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

updateImageAnalysisPrompt();
