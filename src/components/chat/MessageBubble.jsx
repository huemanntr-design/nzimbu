import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Clock, ChevronRight } from 'lucide-react';

const FunctionDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name || 'Function';
  const status = toolCall?.status || 'pending';
  const isRunning = status === 'running' || status === 'in_progress';

  return (
    <div className="mt-2 text-xs">
      <button onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 transition-all">
        {isRunning ? <Loader2 className="h-3 w-3 text-blue-400 animate-spin" /> : 
         status === 'completed' || status === 'success' ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : 
         <Clock className="h-3 w-3 text-muted-foreground" />}
        <span className="text-foreground">{name}</span>
        {!isRunning && <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform", expanded && "rotate-90")} />}
      </button>
      {expanded && toolCall.results && (
        <pre className="mt-1 ml-3 pl-3 border-l-2 border-border bg-secondary rounded p-2 text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-auto">
          {typeof toolCall.results === 'string' ? toolCall.results : JSON.stringify(toolCall.results, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center mt-0.5 shrink-0">
          <span className="text-xs">🤖</span>
        </div>
      )}
      <div className={cn("max-w-[80%]", isUser && "flex flex-col items-end")}>
        {message.content && (
          <div className={cn("rounded-2xl px-4 py-2.5", isUser ? "bg-primary text-primary-foreground" : "bg-secondary")}>
            {isUser ? (
              <p className="text-sm">{message.content}</p>
            ) : (
              <ReactMarkdown className="text-sm prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {message.tool_calls?.map((tc, i) => <FunctionDisplay key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}