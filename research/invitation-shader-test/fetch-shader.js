#!/usr/bin/env node

/**
 * Helper script to fetch shader code from Shadertoy
 * 
 * Usage: node fetch-shader.js lctGRB
 * 
 * This script attempts to fetch the shader code from Shadertoy.
 * Note: Shadertoy may require browser-based access, so you may need to
 * manually copy the code from the website.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const shaderId = process.argv[2] || 'lctGRB';

console.log(`Attempting to fetch shader: ${shaderId}`);

// Try to fetch from Shadertoy API
const options = {
  hostname: 'www.shadertoy.com',
  path: `/api/v1/shaders/${shaderId}?key=`,
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0',
  },
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      
      if (json.Shader && json.Shader.renderpass && json.Shader.renderpass.length > 0) {
        const shaderCode = json.Shader.renderpass[0].code;
        const outputPath = path.join(__dirname, 'src', 'fragmentShader.glsl');
        
        // Convert Shadertoy format to postprocessing format
        let convertedCode = shaderCode;
        
        // Basic conversion: change mainImage signature
        convertedCode = convertedCode.replace(
          /void\s+mainImage\s*\(\s*out\s+vec4\s+fragColor\s*,\s*in\s+vec2\s+fragCoord\s*\)/g,
          'void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor)'
        );
        
        // Replace fragCoord / iResolution.xy with uv (if present)
        convertedCode = convertedCode.replace(/fragCoord\s*\/\s*iResolution\.xy/g, 'uv');
        convertedCode = convertedCode.replace(/fragCoord\s*\/\s*iResolution/g, 'uv * resolution');
        
        // Replace iResolution with resolution
        convertedCode = convertedCode.replace(/\biResolution\b/g, 'resolution');
        
        // Replace fragColor with outputColor
        convertedCode = convertedCode.replace(/\bfragColor\b/g, 'outputColor');
        
        // Add uniform declarations if needed
        if (!convertedCode.includes('uniform float iTime')) {
          convertedCode = 'uniform float iTime;\n\n' + convertedCode;
        }
        
        fs.writeFileSync(outputPath, convertedCode, 'utf8');
        console.log(`✅ Shader code saved to ${outputPath}`);
        console.log('\n⚠️  Note: Manual review and adjustment may be needed.');
        console.log('   Check the conversion and adjust as necessary.');
      } else {
        console.log('❌ Could not find shader code in response');
        console.log('   You may need to manually copy the code from:');
        console.log(`   https://www.shadertoy.com/view/${shaderId}`);
      }
    } catch (error) {
      console.log('❌ Error parsing response:', error.message);
      console.log('   Response:', data.substring(0, 200));
      console.log('\n   Please manually copy the shader code from:');
      console.log(`   https://www.shadertoy.com/view/${shaderId}`);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Error fetching shader:', error.message);
  console.log('\n   Please manually copy the shader code from:');
  console.log(`   https://www.shadertoy.com/view/${shaderId}`);
  console.log('   Then replace the code in src/fragmentShader.glsl');
});

req.end();
