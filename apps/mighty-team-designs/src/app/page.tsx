'use client';

export default function HomePage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Mighty Team Designs - Home Page</h1>
      <p>If you can see this, the basic routing is working!</p>
      <p>Environment check:</p>
      <ul>
        <li>NODE_ENV: {process.env.NODE_ENV}</li>
        <li>STORAGE_TYPE: {process.env.STORAGE_TYPE}</li>
        <li>IMAGE_PROCESSOR_BASE_URL: {process.env.IMAGE_PROCESSOR_BASE_URL ? 'SET' : 'NOT SET'}</li>
        <li>IMAGE_PROCESSOR_API_KEY: {process.env.IMAGE_PROCESSOR_API_KEY ? 'SET' : 'NOT SET'}</li>
        <li>OPENAI_API_KEY: {process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}</li>
      </ul>
    </div>
  );
}
