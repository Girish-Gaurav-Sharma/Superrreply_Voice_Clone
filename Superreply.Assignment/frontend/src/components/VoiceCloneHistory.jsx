import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

const supabase = createClient(
	'https://ikejhklftgrxfyurzcmd.supabase.co',
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZWpoa2xmdGdyeGZ5dXJ6Y21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4MjU0MTksImV4cCI6MjA0NzQwMTQxOX0.YsZEQGwvY1xoq0PWlHt40b0Zs_3hOOIWS9TycmBKLjg'
);

const VoiceCloneHistory = ({ isDarkMode }) => {
	const [recordings, setRecordings] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		fetchRecordings();
	}, []);

	const fetchRecordings = async () => {
		try {
			const { data, error } = await supabase
				.from('voice_clones')
				.select('*')
				.order('created_at', { ascending: false });

			if (error) throw error;
			setRecordings(data);
		} catch (error) {
			console.error('Error fetching recordings:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDownload = async (url, fileName) => {
		try {
			const response = await fetch(url);
			const blob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = downloadUrl;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(downloadUrl);
		} catch (error) {
			console.error('Error downloading file:', error);
		}
	};

	return (
		<div
			className={`p-6 ${
				isDarkMode
					? 'bg-gray-900 text-white'
					: 'bg-gray-100 text-gray-900'
			}`}>
			<h2 className="text-2xl font-semibold mb-6">Voice Clone History</h2>

			{isLoading ? (
				<div className="text-center py-8">Loading...</div>
			) : recordings.length === 0 ? (
				<div className="text-center py-8">No recordings found</div>
			) : (
				<div className="grid gap-4">
					{recordings.map(recording => (
						<div
							key={recording.id}
							className={`p-4 rounded-lg shadow-md ${
								isDarkMode ? 'bg-gray-800' : 'bg-white'
							}`}>
							<div className="flex justify-between items-start mb-2">
								<div>
									<p className="font-medium">
										Created:{' '}
										{format(
											new Date(recording.created_at),
											'PPp'
										)}
									</p>
									<p className="text-sm mt-2 text-gray-500">
										{recording.text}
									</p>
								</div>
								<div className="flex gap-2">
									<button
										onClick={() =>
											handleDownload(
												recording.output_url,
												`generated_voice_${recording.id}.mp3`
											)
										}
										className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
										Download
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default VoiceCloneHistory;
