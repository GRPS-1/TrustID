import { NextResponse } from 'next/server';
import { algodClient, APP_ID } from '@/lib/algorand';

/**
 * Debug endpoint to list all boxes in the app
 */
export async function GET() {
  try {
    const boxes = await algodClient.getApplicationBoxes(APP_ID).do();
    
    const boxList = boxes.boxes.map((box: any) => {
      const boxNameBytes = box.name;
      const boxNameHex = Buffer.from(boxNameBytes).toString('hex');
      const boxNameUtf8 = Buffer.from(boxNameBytes).toString('utf-8', 0, Math.min(boxNameBytes.length, 100));
      
      return {
        nameHex: boxNameHex,
        nameUtf8: boxNameUtf8,
        nameLength: boxNameBytes.length,
        // Try to parse if it's a credential box
        isCredBox: boxNameUtf8.startsWith('cred_'),
        credId: boxNameUtf8.startsWith('cred_') ? boxNameUtf8.substring(5) : null,
      };
    });
    
    return NextResponse.json({
      totalBoxes: boxes.boxes.length,
      boxes: boxList,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
}
