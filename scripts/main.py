from openai import OpenAI

client = OpenAI(
    api_key="your-api-key"
)

response = client.responses.create(
    model="gpt-5.6-terra",
    input="do you know my name?",
    store = True
)

print(response.output_text)