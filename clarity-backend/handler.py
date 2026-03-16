import json
import boto3
import base64

bedrock = boto3.client(service_name='bedrock-runtime', region_name='us-east-1')

def analyze_image(event, context):
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST"
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {"statusCode": 200, "headers": headers, "body": ""}

    try:
        body = json.loads(event.get('body', '{}'))
        image_base64 = body.get('image')
        
        if not image_base64:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "No image"})}

        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]

        image_bytes = base64.b64decode(image_base64)

        # PROMPT KONSULTAN (Tanpa Output Kode, Sangat Stabil)
        prompt_text = (
            "Act as a Senior WCAG Accessibility Auditor. Analyze this UI image. "
            "For each issue found, provide EXACTLY this format:\n"
            "1. **[Issue Title]**\n"
            "Severity: [High/Medium/Low] | WCAG Principle: [Perceivable/Operable/Understandable/Robust]\n"
            "Description: [Explain the barrier and how to fix it conceptually in 2-3 sentences].\n\n"
            "List up to 5 critical issues. "
            "At the very end, on a new line, provide exactly: Clarity Score: [score 0-100]"
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
            # maxTokens cukup 1000 karena hanya teks
            inferenceConfig={"maxTokens": 1000, "temperature": 0.3}
        )

        result_text = response['output']['message']['content'][0]['text']

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"analysis": result_text})
        }

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": "Analysis failed. Please try again."})
        }