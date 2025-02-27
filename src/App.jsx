import { useEffect } from "react";
import { useState } from "react";
import OpenAI from 'openai';

//for speech recognition
const recognition=new(window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;

//for openai
const openai=new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
}
)

function App(){
  const [isListening, setIsListening]=useState(false);
  const [transcript, setTranscript]= useState(" ");
  const [loadingStatus, setLoadingStatus]=useState(false);
  const [feedback, setFeedback]=useState(null);
  const [loadingQuestion, setLoadingQuestion]=useState(true);
  const [question, setQuestion]=useState(null);

  // for submitting the answer

  const handleStoplistening=()=>{
    setIsListening(false);
    recognition.stop();
    
  }

  const handleStartListening=()=>{
    setIsListening(true);
    recognition.start();
      }

  // for handling Reattempt    
  const handleReAttempt=()=>{
    setTranscript("")
    setFeedback(null);
    handleStartListening();
  }

  const handleNextQuestion=()=>{
    setTranscript("");
    setFeedback(null);
    getQuestion();
    
   
  }


    // for getting feedback from AI
    const getFeedback=  async(transcript, question)=>{
      setLoadingStatus(true);
      try{
        const completion= await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          response_format: {type: "json_object"} ,
           messages: [{ 
            role: "system",
            content : "you are an interview coach. The answer you will review are from speech to text transcription. Ignore minor speech recognition errors, filler words or slight grammatical issues that are common in spoken responses. Focus on evaluating the meaning and core content rather than the exact wordings. You must respond in Json object containing exactly three fields, correctness:(0-5) completeness:(0-5) and feedback (string)(in case of irrelevant answer, say the answer is irrelevant)."
           },
          {
            role : "user",
            content: ` Question : ${question}
                      answer : ${transcript}
                      Provide your feedback of evalution as Json object in this following structure:
                      {
                        "correctness": [number between 0-5],
                        "completeness": [number between 0-5],
                        "feedback": "<detailed feedback in max 150 words>"
                      }`

          }],
          
        })
        const gptFeedback= completion.choices[0].message.content;
        const feedback=JSON.parse(gptFeedback);
        setFeedback(feedback);
        console.log(feedback);
      }catch(e){
        console.error("Error fetching feedback:", e);
      }finally{
        setLoadingStatus(false);
      }
    }

// For Getting Question from AI
const getQuestion=  async()=>{
  setLoadingQuestion(true);
  try{
    const completion= await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
       messages: [{ 
        role: "system",
        content : "you are an interview coach. A fresher will use you for interview preparation. Provide a random javascript or react.js concept based question that can be answered verbally in 2 minutes."
       },
      {
        role : "user",
        content: ` 
                  Provide your Question in form of String.
                 `

      }],
      
    })
    const gptQuestion= completion.choices[0].message.content;
    
    setQuestion(gptQuestion);
    setLoadingQuestion(false);
  }catch(e){
    console.error("Error fetching feedback:", e);
  }finally{
    setLoadingQuestion(false);
  }
}

 // for transcript
 useEffect(() => {
  async function fetchQuestion() {
    await getQuestion();
  }
  
  fetchQuestion();

  recognition.onresult = (e) => {
    setTranscript(e.results[e.resultIndex][0].transcript);
  };

  recognition.onend = () => {
    setIsListening(false);
  };

}, []); // Runs only on mount

// ✅ NEW useEffect to call getFeedback when both transcript & question exist
useEffect(() => {
  if (transcript.trim() && question && !isListening) {
    getFeedback(transcript, question);
  }
}, [transcript, question, isListening]);

return(
  
  <>
  <div className="w-full h-screen mx-auto overflow-hidden  flex gap-[30px] px-16 mt-0">
    {/* Question side */}
    
      <div className={`${loadingStatus || feedback ? "max-w-1/2 h-screen":" ml-20 max-w-3xl h-screen"}`}>
       
        <h1 className="text-xl font-bold mt-24">{loadingQuestion? "Loading Question..." : question}</h1>
        <p className="mt-10 font-semibold">Record your answer.</p>
        <p className="text-sm mt-10">Try to answer in accurate manner and to the point in 2 minutes. Upon submission your can get it analysed and get feedback .</p>
        <div className="flex gap-10">
          <button onClick={isListening? handleStoplistening : handleStartListening} className={isListening ? 'bg-green-500 mt-10 font-md text-white rounded-lg px-2 py-1' : 'bg-blue-500 mt-10 font-md text-white rounded-lg px-2 py-1'}>{isListening ? "Submit your answer" : "Record your answer"}</button>
        {feedback && ( <div className="flex gap-10">
          <button onClick={handleReAttempt} className="bg-black mt-10 font-md text-white rounded-lg px-2 py-1">ReAttempt</button>
          <button onClick={handleNextQuestion} className="bg-black mt-10 font-md text-white rounded-lg px-2 py-1">Next Question</button>
          </div>
          )}
        </div>
      <p className="text-red-400">{transcript}</p> 
      </div>
   

    {/* feedback container side */}
    
    
    {feedback && (
      <div className={`${loadingStatus || feedback ? "border-l border-gray-500 max-w-1/2 h-screen":"w-0"}`}>
        <div className=" px-4">
        <p className="mt-24">{loadingStatus? "let's see how you answered": ""}</p>
        <div className="border border-gray-300 px-3 py-2  rounded-lg mt-2 ">
        <h1 className="font-bold">Correctness</h1>
        <p>{feedback.correctness}/5</p>
        <div className="flex gap-2">
        {[...Array(5)].map((_, i)=>{
          return(
            
            <div key={i} className={i<Number(feedback.correctness)? "bg-blue-500 h-1 flex-1":"bg-gray-200 flex-1 h-1"}></div>
            
          );
           

        })}
        </div>
        </div>
        
        <div className="border border-gray-300 px-3 py-2  rounded-lg mt-2">
        <h1 className="font-bold">Completeness</h1>
        <p>{feedback.completeness}/5</p>
        <div className="flex gap-2">
        {[...Array(5)].map((_, i)=>{
          return(
            
            <div key={i} className={i<Number(feedback.completeness)? "bg-blue-500 h-1 flex-1":"bg-gray-200 flex-1 h-1"}></div>
            
          );
           

        })}
        </div>
        </div>
        <div className="border border-gray-300 px-3 py-2  rounded-lg mt-2">
        <h1 className="font-bold">Feedback</h1>
        <p>{feedback.feedback}</p>
        </div>
        
        </div>
      </div>
    )}

    


  </div>
  </>
)
}

export default App;