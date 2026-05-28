import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const message = formData.get('message') as string || '';
    const historyStr = formData.get('history') as string || '[]';
    
    let chatHistory: any[] = [];
    try {
      chatHistory = JSON.parse(historyStr);
    } catch (err) {
      console.error('Failed to parse chat history:', err);
    }

    // 1. Fetch live product catalog from Spring Boot backend
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    let productsList: any[] = [];
    
    try {
      const backendRes = await fetch(`${apiBaseUrl}/api/products?page=0&size=50`);
      if (backendRes.ok) {
        const envelope = await backendRes.json();
        // Envelope structure: { success: true, message: '...', data: { content: [...] } }
        if (envelope.success && envelope.data && envelope.data.content) {
          productsList = envelope.data.content.filter((p: any) => p.isActive && p.stockQuantity > 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch live catalog from Spring Boot:', err);
    }

    // Fallback static products in case Spring Boot is not running locally yet
    if (productsList.length === 0) {
      productsList = [
        { id: 1, name: 'Sleek Leather Jacket', categoryName: 'Outwear', price: 89.99, description: 'Premium black leather jacket with zipper details.', imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', stockQuantity: 10, isActive: true },
        { id: 2, name: 'Floral Summer Dress', categoryName: 'Dresses', price: 49.99, description: 'Flowy sleeveless midi dress with yellow floral pattern.', imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', stockQuantity: 5, isActive: true },
        { id: 3, name: 'Classic Blue Denim Jeans', categoryName: 'Pants', price: 59.99, description: 'Slim fit stretch denim blue jeans.', imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', stockQuantity: 15, isActive: true },
        { id: 4, name: 'White Casual Sneakers', categoryName: 'Shoes', price: 69.99, description: 'Minimalist white leather shoes with comfortable soles.', imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500', stockQuantity: 8, isActive: true },
        { id: 5, name: 'Cropped Knit Sweater', categoryName: 'Knitwear', price: 39.99, description: 'Cozy beige knit cropped sweater for autumn.', imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500', stockQuantity: 4, isActive: true }
      ];
    }

    // Format products catalog into a compact JSON context for Gemini token optimization
    const catalogContext = productsList.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.categoryName,
      price: p.price,
      description: p.description,
      imageUrl: p.imageUrl
    }));

    const apiKey = process.env.GEMINI_API_KEY;

    // --- SIMULATION MODE (No API Key Configured) ---
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('GEMINI_API_KEY is not configured. Running in premium AI Stylist Simulation Mode.');

      const msg = message.toLowerCase().trim();
      const isGreeting = msg === 'hi' || msg === 'hello' || msg === 'chào' || msg === 'xin chào' || msg.includes('chào bạn') || msg.includes('chào ad') || msg === 'hey';

      // Simple simulator rules
      let matchedProducts = [productsList[0], productsList[1]];
      let comment = `To enable complete, live AI recommendations, please add your Google Gemini API Key to \`fashionshop-frontend/.env.local\`. 
      \n\n**[SIMULATION MODE]** Based on your input, here are some stylish items from our collection that might match your style:`;

      if (isGreeting) {
        comment = `**[SIMULATION MODE]** Xin chào! Mình là AI Stylist cá nhân của bạn tại FashionShop. Bạn cần tư vấn chọn đồ hay muốn phối đồ như thế nào hôm nay?`;
        matchedProducts = [];
      } else if (file) {
        // Image uploaded
        comment = `[SIMULATION MODE] I have scanned your uploaded photo ("${file.name}"). I see a fantastic wardrobe piece! Based on the colors and cuts, I recommend these coordinating premium pieces from our store:`;
        if (file.name.toLowerCase().includes('shoe') || file.name.toLowerCase().includes('foot')) {
          matchedProducts = productsList.filter(p => p.categoryName?.toLowerCase().includes('shoe') || p.name.toLowerCase().includes('sneaker'));
        } else if (file.name.toLowerCase().includes('dress') || file.name.toLowerCase().includes('skirt')) {
          matchedProducts = productsList.filter(p => p.categoryName?.toLowerCase().includes('dress') || p.name.toLowerCase().includes('dress'));
        } else if (file.name.toLowerCase().includes('pant') || file.name.toLowerCase().includes('jean')) {
          matchedProducts = productsList.filter(p => p.categoryName?.toLowerCase().includes('pant') || p.name.toLowerCase().includes('jean') || p.name.toLowerCase().includes('denim'));
        } else {
          // General match
          matchedProducts = [productsList[0], productsList[2], productsList[3]].slice(0, 3);
        }
      } else {
        // Text message matching
        if (msg.includes('jacket') || msg.includes('coat') || msg.includes('leather')) {
          matchedProducts = productsList.filter(p => p.name.toLowerCase().includes('jacket') || p.description.toLowerCase().includes('jacket'));
        } else if (msg.includes('dress') || msg.includes('summer')) {
          matchedProducts = productsList.filter(p => p.name.toLowerCase().includes('dress') || p.description.toLowerCase().includes('dress'));
        } else if (msg.includes('jean') || msg.includes('pant') || msg.includes('denim')) {
          matchedProducts = productsList.filter(p => p.name.toLowerCase().includes('jean') || p.name.toLowerCase().includes('pants') || p.description.toLowerCase().includes('jeans'));
        } else if (msg.includes('shoe') || msg.includes('sneaker') || msg.includes('white')) {
          matchedProducts = productsList.filter(p => p.name.toLowerCase().includes('sneaker') || p.name.toLowerCase().includes('shoes') || p.description.toLowerCase().includes('sneakers'));
        } else if (msg.includes('sweater') || msg.includes('knit') || msg.includes('beige')) {
          matchedProducts = productsList.filter(p => p.name.toLowerCase().includes('sweater') || p.description.toLowerCase().includes('sweater'));
        }
      }

      // Simulate a small delay for UI scanner aesthetic
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return NextResponse.json({
        success: true,
        data: {
          stylistComment: comment,
          recommendedProducts: matchedProducts
        }
      });
    }

    // --- REAL GEMINI 2.5 FLASH MULTI-MODAL LOGIC ---
    
    // System prompt guiding style analysis and catalog matching
    const systemPrompt = `You are a highly premium, friendly, and expert personal AI Fashion Stylist for 'FashionShop'.
Your job is to analyze the customer's input and/or uploaded photo, identify the garment style, vibe, colors, or materials, and suggest matching or complementary products from our live store catalog.

Catalog Data (Live Inventory):
${JSON.stringify(catalogContext, null, 2)}

Instructions:
1. If the customer is just greeting you (e.g. "hi", "hello", "chào bạn", "xin chào") or engaging in casual small talk, respond warmly and professionally as their personal stylist, and set "recommendedProductIds" to an empty array [].
2. If they ask for styling advice or upload an image, provide a beautiful, short, and highly helpful fashion assessment/comment under the key "stylistComment" (markdown formatting supported). Select 1 to 4 matching product IDs from the catalog data that best resemble, coordinate with, or complement the user's uploaded image/text. List their integer IDs in an array under "recommendedProductIds".
3. If no catalog items are a solid match, suggest 1 or 2 complementary items (e.g. if they upload a jacket, suggest matching pants or shoes from our catalog).
4. You MUST respond with a valid JSON object only. No markdown fences like \`\`\`json around the JSON. The JSON schema must be exactly:
{
  "stylistComment": "Your stylist text response here...",
  "recommendedProductIds": [id1, id2, ...]
}`;

    // Structure raw contents array
    const rawContents: any[] = [];

    // Add historical messages
    chatHistory.forEach((msg: any) => {
      // Map 'ai' or others to 'model' role
      const role = msg.sender === 'user' ? 'user' : 'model';
      rawContents.push({
        role: role,
        parts: [{ text: msg.text }]
      });
    });

    // Add current user turn
    const currentUserParts: any[] = [];
    currentUserParts.push({ text: message || 'What matches this style or how can I wear this?' });

    if (file) {
      const fileBuffer = await file.arrayBuffer();
      const base64Image = Buffer.from(fileBuffer).toString('base64');
      currentUserParts.push({
        inlineData: {
          mimeType: file.type,
          data: base64Image
        }
      });
    }

    rawContents.push({
      role: 'user',
      parts: currentUserParts
    });

    // Ensure strict alternation of 'user' and 'model' roles as required by Gemini
    const sanitizedContents: any[] = [];
    let expectedRole = 'user';

    rawContents.forEach((turn) => {
      if (turn.role === expectedRole) {
        sanitizedContents.push(turn);
        expectedRole = expectedRole === 'user' ? 'model' : 'user';
      } else if (sanitizedContents.length > 0 && turn.role === sanitizedContents[sanitizedContents.length - 1].role) {
        // Merge consecutive same-role turns to preserve conversation content
        sanitizedContents[sanitizedContents.length - 1].parts.push(...turn.parts);
      } else {
        // Handle out-of-order role by inserting dummy or adapting
        if (expectedRole === 'user' && turn.role === 'model') {
          // Model responded without user turn, add dummy user turn
          sanitizedContents.push({ role: 'user', parts: [{ text: 'Hello' }] });
        }
        sanitizedContents.push(turn);
        expectedRole = turn.role === 'user' ? 'model' : 'user';
      }
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: sanitizedContents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API returned error:', errText);
      throw new Error(`Gemini API error: ${geminiRes.statusText}`);
    }

    const rawData = await geminiRes.json();
    const rawText = rawData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      throw new Error('Gemini API returned empty response parts');
    }

    const parsedResponse = JSON.parse(rawText.trim());
    
    // Map the recommended IDs back to our fully-detailed product objects so the UI has image URLs, prices, etc.
    const finalRecommendedIds: number[] = parsedResponse.recommendedProductIds || [];
    const finalRecommendedProducts = productsList.filter(p => finalRecommendedIds.includes(p.id));

    return NextResponse.json({
      success: true,
      data: {
        stylistComment: parsedResponse.stylistComment,
        recommendedProducts: finalRecommendedProducts
      }
    });

  } catch (error: any) {
    console.error('Visual Stylist API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
