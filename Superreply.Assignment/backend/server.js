require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase client
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_SERVICE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup
const upload = multer();

// Helper function to upload file to Supabase Storage
async function uploadToSupabase(buffer, filename, bucket) {
	const { data, error } = await supabase.storage
		.from(bucket)
		.upload(`${Date.now()}-${filename}`, buffer);

	if (error) throw error;

	const {
		data: { publicUrl },
	} = supabase.storage.from(bucket).getPublicUrl(data.path);

	return publicUrl;
}

// Main endpoint
app.post('/clone-voice', upload.single('audio'), async (req, res) => {
	try {
		// 1. Upload input audio to Supabase
		const inputAudioUrl = await uploadToSupabase(
			req.file.buffer,
			'input-audio.mp3',
			'voice-inputs'
		);

		// 2. Add/clone voice with ElevenLabs
		const voiceFormData = new FormData();
		voiceFormData.append('name', 'Custom Voice');
		voiceFormData.append('files', req.file.buffer, {
			filename: 'voice.mp3',
			contentType: req.file.mimetype,
		});

		const voiceResponse = await axios.post(
			'https://api.elevenlabs.io/v1/voices/add',
			voiceFormData,
			{
				headers: {
					'xi-api-key': process.env.ELEVEN_LABS_API_KEY,
					...voiceFormData.getHeaders(),
				},
			}
		);

		const voiceId = voiceResponse.data.voice_id;

		// 3. Generate speech
		const synthesisResponse = await axios.post(
			`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
			{
				text: req.body.text,
				model_id: 'eleven_monolingual_v1',
				voice_settings: {
					stability: 0.5,
					similarity_boost: 0.75,
				},
			},
			{
				headers: {
					'xi-api-key': process.env.ELEVEN_LABS_API_KEY,
					'Content-Type': 'application/json',
				},
				responseType: 'arraybuffer',
			}
		);

		// 4. Upload generated audio to Supabase
		const outputAudioUrl = await uploadToSupabase(
			Buffer.from(synthesisResponse.data),
			'output-audio.mp3',
			'voice-outputs'
		);

		// 5. Save record to Supabase database
		const { data: recordData, error: recordError } = await supabase
			.from('voice_clones')
			.insert([
				{
					input_url: inputAudioUrl,
					output_url: outputAudioUrl,
					text: req.body.text,
				},
			])
			.select();

		if (recordError) throw recordError;

		// 6. Cleanup - delete voice from ElevenLabs
		try {
			await axios.delete(
				`https://api.elevenlabs.io/v1/voices/${voiceId}`,
				{
					headers: {
						'xi-api-key': process.env.ELEVEN_LABS_API_KEY,
					},
				}
			);
		} catch (deleteError) {
			console.error('Error deleting voice:', deleteError);
		}

		res.json({
			downloadUrl: outputAudioUrl,
			record: recordData[0],
		});
	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({
			error: 'Voice generation failed. Please try again.',
		});
	}
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
