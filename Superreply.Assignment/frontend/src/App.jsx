import React, { useState } from 'react';
import axios from 'axios';
import { FaQuestionCircle, FaMoon, FaSun } from 'react-icons/fa';
import VoiceCloneHistory from './components/VoiceCloneHistory';

const App = () => {
	const [audioFile, setAudioFile] = useState(null);
	const [text, setText] = useState('');
	const [audioUrl, setAudioUrl] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [isDarkMode, setIsDarkMode] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const [activeTab, setActiveTab] = useState('voiceCloner'); // Tab state

	// File handling
	const handleFileChange = e => {
		const file = e.target.files[0];
		if (
			file &&
			file.size <= 5 * 1024 * 1024 &&
			file.type.startsWith('audio')
		) {
			setAudioFile(file);
			setError('');
		} else {
			setError(
				'Please upload an audio file (max 5MB) in a valid format.'
			);
			setAudioFile(null);
		}
	};

	const handleTextChange = e => {
		setText(e.target.value);
	};

	const handleSubmit = async () => {
		if (!audioFile || !text) {
			setError('Upload an audio file and enter the text.');
			return;
		}
		setIsLoading(true);
		setError('');

		const formData = new FormData();
		formData.append('audio', audioFile);
		formData.append('text', text);

		try {
			const response = await axios.post(
				'http://localhost:5000/clone-voice',
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);
			setAudioUrl(response.data.downloadUrl);
		} catch (err) {
			setError('Something went wrong. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const toggleDarkMode = () => {
		setIsDarkMode(!isDarkMode);
	};

	const toggleHelpModal = () => {
		setShowHelp(!showHelp);
	};

	return (
		<div
			className={`min-h-screen ${
				isDarkMode
					? 'bg-gray-900 text-white'
					: 'bg-gray-100 text-gray-900'
			} flex flex-col`}>
			{/* Navbar */}
			<header
				className={`fixed top-0 left-0 right-0 z-50 py-4 shadow-md ${
					isDarkMode
						? 'bg-gray-800 text-white'
						: 'bg-white text-gray-900'
				}`}>
				<div className="flex justify-between items-center px-6 md:px-8">
					<div className="flex items-center space-x-4">
						<img
							src="https://www.superreply.ai/_next/static/media/logo-1.31e1ca00.svg"
							alt="Superreply Logo"
							className="h-10"
						/>
						<h1 className="text-lg md:text-xl font-bold">
							Superreply Voice Cloner
						</h1>
					</div>
					<div className="flex items-center space-x-6">
						<button
							className={`font-medium ${
								activeTab === 'voiceCloner'
									? 'text-purple-500 underline'
									: ''
							}`}
							onClick={() => setActiveTab('voiceCloner')}>
							Voice Cloner
						</button>
						<button
							className={`font-medium ${
								activeTab === 'history'
									? 'text-purple-500 underline'
									: ''
							}`}
							onClick={() => setActiveTab('history')}>
							History
						</button>
						<button
							onClick={toggleDarkMode}
							className="flex items-center text-sm">
							{isDarkMode ? (
								<FaSun size={20} />
							) : (
								<FaMoon size={20} />
							)}
							<span className="ml-2">
								{isDarkMode ? 'Light Mode' : 'Dark Mode'}
							</span>
						</button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-grow px-6 md:px-8 pt-20 pb-12 flex justify-center items-center">
				{activeTab === 'voiceCloner' ? (
					<div
						className={`w-full max-w-xl p-8 rounded-xl shadow-xl ${
							isDarkMode ? 'bg-gray-800' : 'bg-white'
						}`}>
						<h2 className="text-2xl font-semibold text-center mb-6">
							Transform Text into Your Voice
						</h2>
						<p className="text-sm text-center mb-6 text-gray-500">
							Upload a short voice sample, enter the text, and let
							us create your custom voice synthesis!
						</p>

						{/* File Upload */}
						<div className="mb-4">
							<label
								className="block text-lg font-medium mb-2"
								htmlFor="audio-upload">
								Upload Voice Sample
							</label>
							<input
								type="file"
								id="audio-upload"
								accept="audio/*"
								onChange={handleFileChange}
								className="w-full border border-gray-300 rounded-lg p-2"
							/>
							{error && (
								<p className="text-red-500 text-sm mt-2">
									{error}
								</p>
							)}
						</div>

						{/* Text Input */}
						<div className="mb-4">
							<label
								className="block text-lg font-medium mb-2"
								htmlFor="text-input">
								Text to Synthesize
							</label>
							<textarea
								id="text-input"
								value={text}
								onChange={handleTextChange}
								rows="4"
								className="w-full border border-gray-300 rounded-lg p-2"
								placeholder="Enter the text here..."
							/>
						</div>

						{/* Generate Button */}
						<button
							onClick={handleSubmit}
							className={`w-full py-3 text-white rounded-lg font-bold ${
								isLoading
									? 'bg-purple-400 cursor-not-allowed'
									: 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
							}`}
							disabled={isLoading}>
							{isLoading ? 'Generating...' : 'Generate Voice'}
						</button>

						{/* Download Link */}
						{audioUrl && (
							<div className="mt-6 text-center">
								<a
									href={audioUrl}
									download="generated_voice.wav"
									className="text-purple-500 font-medium">
									Download the Generated Voice
								</a>
							</div>
						)}
					</div>
				) : (
					<VoiceCloneHistory />
				)}
			</main>
		</div>
	);
};

export default App;
