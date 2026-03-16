import json
import boto3
import base64

bedrock = boto3.client(service_name='bedrock-runtime', region_name='us-east-1')

def analyze_image(event, context):
    # 1. Definisi Headers CORS yang Wajib Ada
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST"
    }

    # 2. Tangani Preflight Request (CORS OPTIONS) -> Ini yang menghentikan error di browser
    if event.get('httpMethod') == 'OPTIONS':
        return {"statusCode": 200, "headers": headers, "body": ""}

    try:
        body = json.loads(event.get('body', '{}'))
        image_base64 = body.get('image')
        
        if not image_base64:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "No image"})}

        # Pastikan tidak ada prefix "data:image/png;base64," yang terbawa
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]

        # Konversi Base64 String ke Bytes
        image_bytes = base64.b64decode(image_base64)

        # 3. PROMPT YANG DIPERBARUI UNTUK AGENTIC REMEDIATION
        prompt_text = (
            "Analyze this UI for WCAG accessibility issues. "
            "For each issue found, provide: "
            "1. A Title (in bold starting with **) "
            "2. A Description "
            "3. A Technical Solution (start with the tag [SOLUTION] followed by a code snippet wrapped in triple backticks). "
            "At the end, provide exactly: Clarity Score: [score 0-100]"
        )

        messages = [
            {
                "role": "user",
                "content": [
                    {"text": prompt_text},
                    {
                        "image": {
                            "format": "png", 
                            "source": {"bytes": image_bytes}
                        }
                    }
                ]
            }
        ]

        response = bedrock.converse(
            modelId="amazon.nova-pro-v1:0",
            messages=messages,
            # Tingkatkan maxTokens ke 2048 agar Amazon Nova Pro tidak memotong kode solusi di tengah jalan
            inferenceConfig={"maxTokens": 2048, "temperature": 0.5}
        )

        result_text = response['output']['message']['content'][0]['text']

        # 4. Kembalikan response sukses beserta header CORS
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"analysis": result_text})
        }

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        # Kembalikan response error beserta header CORS
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }