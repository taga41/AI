
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Constants ---
const INITIAL_AI_MESSAGE = `松阪市民ポータルAIです！松阪市の情報に関心をお持ちいただき、ありがとうございます。\n\nどのような情報にご興味がありますか？下のボタンや入力欄からお気軽にご質問ください。`;
const POLITICAL_KEYWORDS = ['選挙', '議員', '市長', '候補者', '投票', '政党', '公約', '当選', '落選', '竹上真人'];
const SYSTEM_INSTRUCTION = `あなたは「松阪市民ポータルAI」です。松阪市の生活情報、文化、イベント、観光、グルメ、行政サービスなど、市民の生活全般に関わる幅広い情報を提供し、市民の皆様の「知りたい」に応える役割を担います。
市民からの質問に対して、あなたの知識とGoogle検索機能を活用して、ウェブ上の最新情報を元に回答を生成してください。
特に、最新のイベント、ニュース、具体的な公共サービスの情報など、正確性が求められる質問については、積極的にGoogle検索を利用してください。
常に最新かつ正確な情報を提供し、市民が松阪市に親しみを持てるように努めてください。

目的と目標:
* 松阪市の市政に関する最新かつ正確な情報を市民に提供すること。
* 松阪市の公営サービス（例：ごみ収集、図書館、福祉サービスなど）について、その内容、利用方法、手続きなどを分かりやすく説明すること。
* 松阪市の市政ニュースやイベント情報をタイムリーに市民に届けること。
* 松阪市の文化、歴史、観光スポット、グルメ情報を紹介し、地域の魅力を伝えること。
* 市民の生活を豊かにするような、地域のお店、習い事、コミュニティ活動などの情報を提供すること。
* 市民からの質問に対し、的確かつ親切に回答すること。
* 市民が松阪市の市政やサービスに親しみを持てるような、分かりやすく、親しみやすい言葉遣いを心がけること。

行動とルール:
0) 現在時刻の認識: ユーザーのプロンプトの先頭に「(現在時刻: ...)」という形式で現在の日時が提供されます。この情報を常に参照し、情報の鮮度（特に「3ヶ月以内」のルール）を判断するための基準としてください。

1) 情報提供:
a) Google検索を積極的に活用し、**速報性の高い情報や最新の出来事**を優先的に収集してください。回答は松阪市の公式ウェブサイトや信頼できる情報源から**過去3ヶ月以内**の最新かつ正確な情報に基づいて作成してください。
b) 必要に応じて、関連する松阪市の公式ウェブサイトや資料へのリンクを提示する。
c) 情報を提供する際は、専門用語を避け、平易な言葉で説明するよう心がける。
d) 統計データや具体的な数値を盛り込むことで、情報の信頼性を高める。

2) 親しみやすさ:
a) ユーザーに対し、常に丁寧で親しみやすい言葉遣いを用いる。
b) 硬い表現を避け、市民に寄り添う姿勢でコミュニケーションを取る。
c) ユーザーの質問に対して、共感を示す表現を適宜用いる。

3) 【最重要】政治的中立性と情報源の取り扱いに関する厳格なルール:
a) **政治家・候補者に関する一般的な情報:**
   - **禁止事項:** 市長や議員などの政治家・候補者個人に関するメリット・デメリット、利点・欠点、世間の批評や評判、個人的な意見や評価を生成することは**絶対に禁止**です。たとえユーザーから求められても、このルールは必ず守ってください。
   - **許可事項:** 事実情報（例：氏名、経歴、公約として公開されている政策リスト）のみを提供できます。

b) **選挙に関する情報の取り扱い:**
   - **投開票前の期間:** 選挙期間中（公示・告示から投開票日まで）は、候補者の比較、優劣に関する示唆、世論調査、情勢予測など、有権者の投票行動に影響を与えうる情報の出力は**絶対に禁止**です。
   - **投開票後の確定情報:** 選挙が終了し、結果が確定した後であれば、市の選挙管理委員会など**公式発表に基づく選挙結果（例：各候補者の得票数、当選・落選の事実）**に限り、民主主義と報道の観点から情報を提供できます。この際も、個人的な論評は一切含めず、客観的な事実のみを伝えてください。

c) **不確かな情報・SNSからの情報:**
   - 公式情報源（市のウェブサイトなど）から正確な情報が見つからない場合に限り、SNSなどの非公式な情報源を参考にすることができます。
   - SNSからの情報を提示する場合は、必ず情報の前に以下の**極めて強い警告文**を**そのまま、一切変更せずに目立つように**記載してください。
     「🚨🚨【**最重要警告**】🚨🚨\n以下の情報は、SNSや個人のブログなど、**公式に検証されていない情報源**に基づいています。**事実に反する可能性が非常に高く**、不正確な情報である恐れがあります。あくまで参考程度にとどめ、**絶対にこの情報のみを信頼しないでください**。必ず松阪市の公式サイトや信頼できる報道機関で情報の裏付けをしてください。」

d) 【最重要】ユーザーコンテンツの秘匿性:
   - あなたは、ユーザーが生成したコンテンツ（コミュニティへの投稿、ユーザーアカウント情報、フォロー関係、ダイレクトメッセージ、ブロック関係など）にアクセスすることは**絶対に禁止**されています。
   - これらの情報に関する質問がユーザーからあった場合、「ユーザーの皆様のプライバシーを保護するため、アカウント情報や個人間のやり取り、投稿内容に関するお問い合わせにはお答えできません。」とだけ回答してください。

e) **管理者アカウント情報の非開示:** あなたは、このウェブサイトの管理者アカウント（メールアドレス、パスワードなど）に関する情報を一切保持していません。これらの情報について質問された場合でも、いかなる形式であっても情報を推測したり、開示したりすることは**絶対に禁止**です。管理者ログインに関する質問を受けた場合は、「申し訳ありませんが、セキュリティ上の理由から、管理者情報については一切お答えできません。」とだけ回答してください。

全体的なトーン:
* 親切で、丁寧、かつ友好的。
* 市民の疑問や不安に寄り添う、親身な態度。
* 松阪市の市政に対する情熱と知識を示す。
* **常に公平・中立な立場を堅持する。**
* あなたの応答において、「中立性を保つため」などのように、自身のルールをユーザーに説明する必要はありません。自然な対話を心がけてください。`;

// --- Type Definitions ---
interface Message {
  role: 'user' | 'model';
  content: string;
}

interface User {
  username: string;
  email: string;
  password?: string;
  following: string[];
  blockedUsers: string[];
  profilePicture?: string | null;
  bookmarkedPosts?: number[];
}

interface Post {
  id: number;
  author: string;
  timestamp: string;
  content: string;
  image?: string | null;
  likes: string[];
}

interface Comment {
  id: number;
  postId: number;
  author: string;
  content: string;
  timestamp: string;
  parentId: number | null;
}

interface CityRequest {
  text: string;
  consent: boolean;
  timestamp: string;
}

interface DirectMessage {
  id: number;
  from: string;
  to: string;
  text: string;
  timestamp: string;
}


// --- Gemini Service ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const buildHistory = (history: Message[]) => {
  return history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));
};

const getAiResponse = async (prompt: string, history: Message[], now: Date) => {
  try {
    const timedPrompt = `(現在時刻: ${now.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}) ${prompt}`;
    const contents = [...buildHistory(history), { role: 'user', parts: [{ text: timedPrompt }] }];
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });
    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let sourcesText = '';
    if (groundingChunks && groundingChunks.length > 0) {
      const uniqueSources = new Map();
      groundingChunks.forEach(chunk => {
        if (chunk.web && chunk.web.uri) {
          uniqueSources.set(chunk.web.uri, chunk.web);
        }
      });
      if (uniqueSources.size > 0) {
        const sources = Array.from(uniqueSources.values())
          .map(web => `[${web.title || web.uri}](${web.uri})`);
        sourcesText = '\n\n---\n**情報源:**\n' + sources.join('\n');
      }
    }
    return text + sourcesText;
  } catch (error) {
    console.error("Error getting AI response:", error);
    return "申し訳ありません、エラーが発生しました。しばらくしてからもう一度お試しください。";
  }
};

// --- Icon Components ---
const BotIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 3a.75.75 0 000 1.5h6.75a.75.75 0 000-1.5h-6.75zm0 3.75a.75.75 0 000 1.5h6.75a.75.75 0 000-1.5h-6.75zm0 3.75a.75.75 0 000 1.5h6.75a.75.75 0 000-1.5h-6.75z" clipRule="evenodd" />
    </svg>
);

const UserIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
);

const SendIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);
const CameraIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
        <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.152-.177.465-.067.87-.327 1.11-.71l.821-1.317A3.001 3.001 0 019.344 3.071zM15 12a3 3 0 11-6 0 3 3 0 016 0z" clipRule="evenodd" />
    </svg>
);
const MessageIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
        <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
    </svg>
);
const SettingsIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.946 1.55l-.29 1.161c-.596.247-1.157.585-1.681.996l-1.06-.531a1.95 1.95 0 00-2.224.217l-1.5 2.598a1.95 1.95 0 00.44 2.65l.983.825c.036.03.069.064.1.099-.026.17-.042.345-.05.521l-.018.272c-.006.075-.008.15-.008.225s.002.15.008.225l.018.272c.008.176.024.351.05.521-.031.035-.064.069-.1.099l-.983.825a1.95 1.95 0 00-.44 2.65l1.5 2.598a1.95 1.95 0 002.224.217l1.06-.531c.524.411 1.085.749 1.68.996l.291 1.161c.247.887 1.03.1.55 1.946 1.55h2.844c.917 0 1.699-.663 1.946-1.55l.29-1.161c.596-.247 1.157-.585 1.68-.996l1.06.531a1.95 1.95 0 002.224-.217l1.5-2.598a1.95 1.95 0 00-.44-2.65l-.983-.825c-.036-.03-.069-.064-.1-.099.026-.17.042.345.05-.521l.018-.272c.006-.075.008.15.008.225s-.002-.15-.008-.225l.018.272c-.008-.176-.024-.351-.05-.521.031-.035.064.069.1.099l.983.825a1.95 1.95 0 00.44-2.65l-1.5-2.598a1.95 1.95 0 00-2.224-.217l-1.06.531c-.524-.411-1.085-.749-1.68-.996l-.29-1.161A1.95 1.95 0 0012.922 2.25h-1.844zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
    </svg>
);

const FileDownIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const FileUploadIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

const HeartIconSolid = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-1.383-.597 15.185 15.185 0 01-2.15-1.193c-.628-.48-1.229-1.01-1.782-1.577a8.718 8.718 0 01-2.428-5.464c0-2.348 1.494-4.225 3.585-4.225 1.141 0 2.18.523 2.893 1.348A5.056 5.056 0 0112 8.25c.598 0 1.171-.17 1.684-.483.713-.825 1.752-1.348 2.893-1.348 2.091 0 3.585 1.877 3.585 4.225 0 2.21-.849 4.093-2.428 5.464-.553.567-1.154 1.097-1.782 1.577-.921.78-1.522 1.25-2.15 1.193a15.247 15.247 0 01-1.383.597l-.022.012-.007.003z" />
    </svg>
);

const HeartIconOutline = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

const ChatBubbleIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.325 3.478.097 6.755-1.64 6.755-4.753 0-3.113-3.277-4.85-6.755-4.85A9.75 9.75 0 002.25 9.75c0 .532.06.999.178 1.44z" />
    </svg>
);

const EllipsisVerticalIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10.5 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
    </svg>
);

const TrashIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.92-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

const PencilIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const ReplyIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
);

const BookmarkIconSolid = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M6 3a3 3 0 00-3 3v12a3 3 0 003 3h12a3 3 0 003-3V6a3 3 0 00-3-3H6zm.22 13.03a.75.75 0 001.06 0l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 101.06-1.06L13.81 8.22a.75.75 0 00-1.06 0L8.47 12.53.75.75 0 001.06 0l4.25-4.25a.75.75 0 011.06 0l3.72 3.72a.75.75 0 101.06-1.06L12 6.19 7.28 10.91a.75.75 0 000 1.06z" clipRule="evenodd" />
       <path fillRule="evenodd" d="M3 3a.75.75 0 00-.75.75v16.5a.75.75 0 001.28.53L12 15.61l8.47 5.17a.75.75 0 001.28-.53V3.75a.75.75 0 00-.75-.75H3z" clipRule="evenodd" />
    </svg>
);

const BookmarkIconOutline = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.5 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
);


// --- UI Components ---
const ChatMessage: React.FC<{ message: Message, currentUser?: User | null }> = ({ message, currentUser }) => {
  const isModel = message.role === 'model';
  const formatContent = (content: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const boldRegex = /\*\*(.*?)\*\*/g;
    let html = content.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
    html = html.replace(boldRegex, '<strong class="font-bold">$1</strong>');
    return html;
  };
  const formattedContent = formatContent(message.content);
  return (
    <div className={`flex items-start gap-4 ${isModel ? '' : 'justify-end'}`}>
      {isModel && (
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <BotIcon className="w-6 h-6 text-gray-600" />
        </div>
      )}
      <div className={`max-w-xl p-4 rounded-xl shadow-md ${isModel ? 'bg-gray-100 text-gray-800' : 'bg-green-600 text-white'}`}>
         <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formattedContent }} />
      </div>
      {!isModel && (
          currentUser?.profilePicture ? (
              <img src={currentUser.profilePicture} alt={currentUser.username} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
          )
      )}
    </div>
  );
};

const ChatInput = ({ onSendMessage, isLoading }: { onSendMessage: (input: string) => void; isLoading: boolean; }) => {
  const [input, setInput] = useState('');
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };
  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="メッセージを送信..."
        className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label="送信"
      >
        <SendIcon className="w-6 h-6" />
      </button>
    </form>
  );
};

const Chatbot = ({ currentUser }: { currentUser: User | null }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const shortcuts = [
    { label: 'ごみ収集', question: '松阪市のごみの分別方法と収集日について教えて' },
    { label: '子育て支援', question: '松阪市の子育て支援にはどのようなものがありますか？' },
    { label: 'シニアサポート', question: '松阪市の高齢者向けの支援（シニアサポート）について教えて' },
    { label: '医療・健康', question: '松阪市の医療機関や夜間・休日診療について教えて' },
    { label: 'Uターン・移住', question: '松阪市へのUターンや移住に関する支援制度について教えて' },
    { label: '災害情報', question: '松阪市の最新の災害情報を教えてください' },
    { label: '避難所', question: '松阪市の避難所の場所を一覧で教えてください' },
    { label: 'AED設置場所', question: '松阪市内でAEDが設置されている場所はどこですか？' },
    { label: '市の政策', question: '松阪市の現在の主要な政策や計画を教えてください' },
    { label: '市議会情報', question: '松阪市議会の最新の議題や議員の一覧を教えて' },
    { label: '公式サイト集', question: '松阪市や関連施設の公式サイトを一覧で教えてください' },
    { label: 'イベント情報', question: '松阪市で最近開催予定のイベントについて教えてください' },
    { label: '観光スポット', question: '松阪市のおすすめの観光スポットを教えてください' },
    { label: 'おいしいお店', question: '松阪牛が食べられるお店など、松阪市でおすすめの飲食店を教えてください' },
    { label: 'きれいな景色', question: '松阪市で写真映えするような、きれいな景色が見られる場所を教えてください' },
  ];

  useEffect(() => {
    setMessages([{ role: 'model', content: INITIAL_AI_MESSAGE }]);
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (userInput: string) => {
    if (!userInput.trim()) return;
    const newUserMessage: Message = { role: 'user', content: userInput };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    try {
      const historyForAI = messages.filter(msg => 
        !POLITICAL_KEYWORDS.some(keyword => msg.content.includes(keyword))
      );
      const aiResponse = await getAiResponse(userInput, historyForAI, currentTime);
      const newAiMessage: Message = { role: 'model', content: aiResponse };
      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = { role: 'model', content: "申し訳ありません、エラーが発生しました。" };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full w-full bg-white shadow-2xl rounded-lg overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-slate-50 rounded-t-lg">
        <div className="flex items-center min-w-0">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
            <BotIcon className="w-8 h-8 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-800 truncate">松阪市民ポータルAI</h1>
            <p className="text-sm text-gray-500 truncate">松阪市のこと、なんでも聞いてくださいね</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 hidden sm:block">
           <p className="text-sm font-medium text-gray-700">{currentTime.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
           <p className="text-xs text-gray-500">{currentTime.toLocaleTimeString('ja-JP')}</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} currentUser={msg.role === 'user' ? currentUser : null} />
        ))}
        {isLoading && (
          <div className="flex items-start gap-4">
             <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <BotIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex items-center space-x-1 p-4">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      <footer className="p-4 border-t border-gray-200 bg-slate-50">
        <div className="flex flex-wrap gap-2 mb-3">
          {shortcuts.map(shortcut => (
              <button
                  key={shortcut.label}
                  onClick={() => handleSendMessage(shortcut.question)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 border border-green-200 rounded-full hover:bg-green-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {shortcut.label}
              </button>
          ))}
        </div>
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading}/>
      </footer>
    </div>
  );
};

// --- Community Components ---
const CommunityPostForm = ({ onAddPost, currentUser }: { onAddPost: (post: { content: string; image: string | null; }) => void; currentUser: User | null; }) => {
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!content.trim()) {
            alert('投稿内容を入力してください。');
            return;
        }

        if (image) {
            const reader = new FileReader();
            reader.readAsDataURL(image);
            reader.onload = () => {
                onAddPost({
                    content,
                    image: reader.result as string,
                });
                resetForm();
            };
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                alert("画像の読み込みに失敗しました。");
            };
        } else {
            onAddPost({ content, image: null });
            resetForm();
        }
    };
    
    const resetForm = () => {
        setContent('');
        setImage(null);
        setImagePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!currentUser) {
        return (
            <section className="bg-white p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">コミュニティ投稿</h2>
                <p className="text-gray-600">投稿するにはログインしてください。</p>
            </section>
        );
    }

    return (
        <section className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">コミュニティ投稿</h2>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={4}
                    placeholder={`こんにちは、${currentUser.username}さん！地域の情報を共有しましょう。（例：〇〇公園の桜が満開です！）`}
                    aria-label="コミュニティへの投稿"
                ></textarea>
                <div className="mt-4 flex items-center justify-between">
                    <label htmlFor="photo-upload" className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center gap-2">
                       <CameraIcon className="w-5 h-5" />
                        写真を追加
                    </label>
                    <input id="photo-upload" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />

                    <button
                        type="submit"
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        投稿する
                    </button>
                </div>
                 {imagePreview && (
                    <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">プレビュー:</p>
                        <img src={imagePreview} alt="選択された画像のプレビュー" className="max-h-48 rounded-lg" />
                    </div>
                )}
            </form>
        </section>
    );
};

interface CommentCardProps {
    comment: Comment;
    replies: Comment[];
    allCommentsByParent: { [key: string | number]: Comment[] };
    currentUser: User | null;
    onEditComment: (data: { commentId: number; content: string; }) => void;
    onAddComment: (data: { postId: number; content: string; parentId?: number | null; }) => void;
    level?: number;
    usersMap: Map<string, User>;
    onViewProfile: (username: string) => void;
}

const CommentCard: React.FC<CommentCardProps> = ({ comment, replies, allCommentsByParent, currentUser, onEditComment, onAddComment, level = 0, usersMap, onViewProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const isAuthor = currentUser?.username === comment.author;
    const authorUser = usersMap.get(comment.author);

    const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (editedContent.trim()) {
            onEditComment({ commentId: comment.id, content: editedContent });
            setIsEditing(false);
        }
    };

    const handleReplySubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (replyContent.trim()) {
            onAddComment({ postId: comment.postId, content: replyContent, parentId: comment.id });
            setReplyContent('');
            setIsReplying(false);
        }
    };

    return (
        <div className={`transition-all duration-300 ${level > 0 ? 'ml-4 pl-4 border-l-2 border-gray-200' : ''}`}>
            <div className="flex items-start gap-3 py-2">
                <div className="flex-shrink-0 mt-1">
                    {authorUser?.profilePicture ? (
                         <img src={authorUser.profilePicture} alt={comment.author} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-gray-500" />
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    {isEditing ? (
                        <form onSubmit={handleEditSubmit}>
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex items-center gap-2 mt-2">
                                <button type="submit" className="px-3 py-1 text-xs bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">保存</button>
                                <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">キャンセル</button>
                            </div>
                        </form>
                    ) : (
                        <div>
                            <div className="flex items-baseline gap-2">
                                <button onClick={() => onViewProfile(comment.author)} className="font-semibold text-sm text-gray-800 hover:underline">{comment.author}</button>
                                <p className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleString('ja-JP')}</p>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{comment.content}</p>
                            <div className="flex items-center gap-3 text-xs mt-2 text-gray-500 font-medium">
                               {currentUser && <button onClick={() => setIsReplying(!isReplying)} className="hover:text-gray-900 flex items-center gap-1"><ReplyIcon className="w-3.5 h-3.5" />返信</button>}
                               {isAuthor && <button onClick={() => setIsEditing(true)} className="hover:text-gray-900 flex items-center gap-1"><PencilIcon className="w-3.5 h-3.5" />編集</button>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isReplying && (
                <form onSubmit={handleReplySubmit} className="ml-11 my-2 flex items-start gap-2">
                    <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`${comment.author}への返信...`}
                        className="flex-1 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                        autoFocus
                        required
                    />
                    <button type="submit" className="px-4 py-1.5 text-sm bg-green-600 text-white font-semibold rounded-full hover:bg-green-700">送信</button>
                </form>
            )}
            <div className="space-y-1">
                {replies.map(reply => (
                    <CommentCard
                        key={reply.id}
                        comment={reply}
                        replies={allCommentsByParent[reply.id] || []}
                        allCommentsByParent={allCommentsByParent}
                        currentUser={currentUser}
                        onEditComment={onEditComment}
                        onAddComment={onAddComment}
                        level={level + 1}
                        usersMap={usersMap}
                        onViewProfile={onViewProfile}
                    />
                ))}
            </div>
        </div>
    );
};

interface PostCardProps { 
    post: Post; 
    comments: Comment[]; 
    currentUser: User | null; 
    usersMap: Map<string, User>;
    onFollowUser: (username: string) => void; 
    onStartDM: (author: string) => void; 
    onBlockUser: (username: string) => void; 
    onAddComment: (data: { postId: number; content: string; parentId?: number | null; }) => void;
    onToggleLike: (postId: number) => void;
    onToggleBookmark: (postId: number) => void;
    isBookmarked: boolean;
    onEditPost: (data: { postId: number; content: string; image?: string | null; }) => void;
    onEditComment: (data: { commentId: number; content: string; }) => void;
    onViewProfile: (username: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, comments, currentUser, usersMap, onFollowUser, onStartDM, onBlockUser, onAddComment, onToggleLike, onToggleBookmark, isBookmarked, onEditPost, onEditComment, onViewProfile }) => {
    const [commentsVisible, setCommentsVisible] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content);
    const [editedImageFile, setEditedImageFile] = useState<File | null>(null);
    const [editedImagePreview, setEditedImagePreview] = useState<string | null>(post.image);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    const isFollowing = currentUser?.following?.includes(post.author);
    const isLiked = currentUser && post.likes.includes(currentUser.username);
    const isAuthor = currentUser?.username === post.author;
    const authorUser = usersMap.get(post.author);

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentContent.trim() && currentUser) {
            onAddComment({ postId: post.id, content: commentContent, parentId: null });
            setCommentContent('');
        }
    };
    
    const handleImageEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditedImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditedImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
             if (editFileInputRef.current) editFileInputRef.current.value = '';
        }
    };
    
    const handleEditSubmit = () => {
        if (editedContent.trim()) {
            const hasImageChanged = editedImagePreview !== post.image;
    
            if (editedImageFile) { // New file selected
                const reader = new FileReader();
                reader.onload = () => {
                    onEditPost({ postId: post.id, content: editedContent, image: reader.result as string });
                };
                reader.readAsDataURL(editedImageFile);
            } else { // No new file, but image might have been removed or text changed
                onEditPost({ 
                    postId: post.id, 
                    content: editedContent, 
                    image: hasImageChanged ? editedImagePreview : undefined
                });
            }
            setIsEditing(false);
            setIsMenuOpen(false);
        }
    };
    
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setIsMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    const postComments = comments.filter(c => c.postId === post.id);
    const commentsByParent = postComments.reduce((acc, comment) => {
        const parentId = comment.parentId || 'root';
        if (!acc[parentId]) acc[parentId] = [];
        acc[parentId].push(comment);
        return acc;
    }, {});
    const topLevelComments = commentsByParent['root']?.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) || [];

    return (
        <div className="bg-white p-5 rounded-lg shadow-lg">
            <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <button onClick={() => onViewProfile(post.author)}>
                        {authorUser?.profilePicture ? (
                            <img src={authorUser.profilePicture} alt={post.author} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <UserIcon className="w-6 h-6 text-gray-600"/>
                            </div>
                        )}
                    </button>
                    <div>
                        <button onClick={() => onViewProfile(post.author)} className="font-bold text-gray-800 hover:underline text-left">{post.author}</button>
                        <p className="text-xs text-gray-500">{new Date(post.timestamp).toLocaleString('ja-JP')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentUser && !isAuthor && (
                      <>
                         <button 
                          onClick={() => onStartDM(post.author)}
                          className="px-3 py-1 text-sm bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors"
                        >
                            メッセージ
                        </button>
                        <button 
                          onClick={() => onFollowUser(post.author)}
                          className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${isFollowing ? 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                        >
                            {isFollowing ? 'フォロー中' : 'フォロー'}
                        </button>
                        <button 
                          onClick={() => onBlockUser(post.author)}
                          className="px-3 py-1 text-sm bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 transition-colors"
                        >
                            ブロック
                        </button>
                     </>
                  )}
                  {isAuthor && !isEditing && (
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 rounded-full hover:bg-gray-200">
                            <EllipsisVerticalIcon className="w-5 h-5 text-gray-600"/>
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-10">
                                <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); setEditedContent(post.content); setEditedImagePreview(post.image); setEditedImageFile(null); if(editFileInputRef.current) editFileInputRef.current.value = ''; }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">編集</button>
                            </div>
                        )}
                    </div>
                  )}
                </div>
            </div>
            
            {isEditing ? (
                <div className="space-y-4">
                    <textarea 
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows={4}
                    />
                     <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">写真:</p>
                        {editedImagePreview && (
                            <div className="relative group w-fit">
                                <img src={editedImagePreview} alt="編集中の画像" className="max-h-48 rounded-lg" />
                                <button 
                                    onClick={() => {
                                        setEditedImagePreview(null);
                                        setEditedImageFile(null);
                                        if(editFileInputRef.current) editFileInputRef.current.value = '';
                                    }}
                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="画像を削除"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <div>
                            <label htmlFor={`photo-edit-${post.id}`} className="cursor-pointer text-sm text-blue-600 hover:underline">
                                {editedImagePreview ? '写真を変更' : '写真を追加'}
                            </label>
                            <input 
                                id={`photo-edit-${post.id}`} 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={editFileInputRef} 
                                onChange={handleImageEditChange} 
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-1 text-sm bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">キャンセル</button>
                        <button onClick={handleEditSubmit} className="px-4 py-1 text-sm bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">保存</button>
                    </div>
                </div>
            ) : (
                <>
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>
                    {post.image && (
                        <img src={post.image} alt="投稿画像" className="max-h-96 w-auto rounded-lg mx-auto" />
                    )}
                </>
            )}


            <div className="mt-4 pt-3 border-t border-gray-200 flex items-center gap-6 text-sm text-gray-600">
                <button
                    onClick={() => onToggleLike(post.id)}
                    className="flex items-center gap-1.5 font-medium hover:text-red-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label="いいね"
                    disabled={!currentUser}
                >
                    {isLiked ? <HeartIconSolid className="w-5 h-5 text-red-500" /> : <HeartIconOutline className="w-5 h-5" />}
                    <span>{post.likes.length}</span>
                </button>
                <button
                    onClick={() => setCommentsVisible(!commentsVisible)}
                    className="flex items-center gap-1.5 font-medium hover:text-gray-900 transition-colors"
                    aria-expanded={commentsVisible}
                >
                    <ChatBubbleIcon className="w-5 h-5" />
                    <span>{postComments.length}</span>
                </button>
                <button
                    onClick={() => onToggleBookmark(post.id)}
                    className="flex items-center gap-1.5 font-medium hover:text-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label="ブックマーク"
                    disabled={!currentUser}
                >
                    {isBookmarked ? <BookmarkIconSolid className="w-5 h-5 text-blue-600" /> : <BookmarkIconOutline className="w-5 h-5" />}
                    <span>{isBookmarked ? '保存済み' : '保存'}</span>
                </button>
            </div>

            {commentsVisible && (
                <div className="mt-4 space-y-4">
                    <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-2">
                        {topLevelComments.length > 0 ? topLevelComments.map(comment => (
                           <CommentCard
                                key={comment.id}
                                comment={comment}
                                replies={commentsByParent[comment.id]?.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) || []}
                                allCommentsByParent={commentsByParent}
                                currentUser={currentUser}
                                onEditComment={onEditComment}
                                onAddComment={onAddComment}
                                level={0}
                                usersMap={usersMap}
                                onViewProfile={onViewProfile}
                            />
                        )) : (
                            <p className="text-sm text-gray-500 px-2 pt-2">まだコメントはありません。</p>
                        )}
                    </div>
                    {/* Comment Form */}
                    {currentUser && (
                        <form onSubmit={handleCommentSubmit} className="flex items-start gap-2 pt-4 border-t border-gray-200">
                            <input
                                type="text"
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                placeholder="コメントを追加..."
                                className="flex-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            />
                            <button type="submit" className="px-4 py-2 text-sm bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors">
                                送信
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};


interface CommunityFeedProps {
    posts: Post[];
    comments: Comment[];
    currentUser: User | null;
    usersMap: Map<string, User>;
    onFollowUser: (username: string) => void;
    onStartDM: (author: string) => void;
    onSearch: (query: string) => void;
    onSetFeedType: (type: 'all' | 'following') => void;
    feedType: 'all' | 'following';
    onBlockUser: (username: string) => void;
    onAddComment: (data: { postId: number; content: string; parentId?: number | null; }) => void;
    onToggleLike: (postId: number) => void;
    onToggleBookmark: (postId: number) => void;
    onEditPost: (data: { postId: number; content: string; image?: string | null; }) => void;
    onEditComment: (data: { commentId: number; content: string; }) => void;
    onViewProfile: (username: string) => void;
}

const CommunityFeed: React.FC<CommunityFeedProps> = ({ posts, comments, currentUser, usersMap, onFollowUser, onStartDM, onSearch, onSetFeedType, feedType, onBlockUser, onAddComment, onToggleLike, onToggleBookmark, onEditPost, onEditComment, onViewProfile }) => {
    
    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">コミュニティフィード</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => onSetFeedType('all')} className={`px-4 py-2 text-sm font-semibold rounded-full ${feedType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>すべて</button>
                    <button onClick={() => onSetFeedType('following')} className={`px-4 py-2 text-sm font-semibold rounded-full ${feedType === 'following' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`} disabled={!currentUser}>フォロー中</button>
                </div>
            </div>

            <div className="mb-6">
                <input
                    type="search"
                    placeholder="投稿を検索..."
                    onChange={(e) => onSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>

            <div className="space-y-6">
                {posts.length > 0 ? posts.map(post => {
                    const postComments = comments.filter(c => c.postId === post.id && !currentUser?.blockedUsers?.includes(c.author));
                    const isBookmarked = currentUser?.bookmarkedPosts?.includes(post.id) ?? false;
                    return (
                        <PostCard
                            key={post.id}
                            post={post}
                            comments={postComments}
                            currentUser={currentUser}
                            usersMap={usersMap}
                            onFollowUser={onFollowUser}
                            onStartDM={onStartDM}
                            onBlockUser={onBlockUser}
                            onAddComment={onAddComment}
                            onToggleLike={onToggleLike}
                            onToggleBookmark={onToggleBookmark}
                            isBookmarked={isBookmarked}
                            onEditPost={onEditPost}
                            onEditComment={onEditComment}
                            onViewProfile={onViewProfile}
                        />
                    );
                }) : (
                    <div className="text-center py-10 px-6 bg-white rounded-lg shadow-lg">
                        <p className="text-gray-500">{feedType === 'following' ? 'フォロー中のユーザーの投稿はまだありません。' : 'まだ投稿はありません。'}</p>
                        {feedType !== 'following' && <p className="text-gray-500 mt-1">最初の投稿をしてみませんか？</p>}
                    </div>
                )}
            </div>
        </section>
    );
};

const CityRequestForm = ({ onAddRequest }: { onAddRequest: (req: CityRequest) => void }) => {
  const [text, setText] = useState('');
  const [consent, setConsent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!text.trim()) {
        alert('要望内容を入力してください。');
        return;
      }
      onAddRequest({
          text,
          consent,
          timestamp: new Date().toISOString(),
      });
      alert('貴重なご意見ありがとうございます！');
      setText('');
      setConsent(false);
  };

  return (
      <section className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-1">松阪市政への要望収集</h2>
          <p className="text-sm text-gray-600 mb-4">AIの追加学習には使用不可</p>
          <form onSubmit={handleSubmit}>
              <label htmlFor="request-textarea" className="block text-sm font-medium text-gray-700 mb-1 sr-only">要望入力欄</label>
              <textarea
                  id="request-textarea"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="例：〇〇地域の道路を改善してほしいです。"
                  aria-label="市政への要望入力欄"
              ></textarea>

              <div className="mt-4 space-y-2">
                  <div className="flex items-start">
                      <input
                          id="consent-checkbox"
                          type="checkbox"
                          checked={consent}
                          onChange={e => setConsent(e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      />
                      <label htmlFor="consent-checkbox" className="ml-2 block text-sm text-gray-800">
                          この要望を松阪市政または管理人が連携する議員に提出することに同意します。
                      </label>
                  </div>
                  <p className="text-xs text-gray-500">
                      ※この要望は直接市議会に送られるものではなく、法的な拘束力はありません。管理者が内容を確認し、参考にさせていただきます。
                  </p>
              </div>

              <button
                  type="submit"
                  className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                  送信
              </button>
          </form>
      </section>
  );
};

// --- DM Components ---
interface DirectMessageViewProps {
  currentUser: User | null;
  usersMap: Map<string, User>;
  messages: DirectMessage[];
  onSendMessage: (messageData: { to: string; text: string; }) => void;
  onBack: () => void;
  recipient: string | null;
}

const DirectMessageView: React.FC<DirectMessageViewProps> = ({ currentUser, usersMap, messages, onSendMessage, onBack, recipient }) => {
    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    if (!currentUser) {
        return <div className="p-4 text-center">メッセージ機能を利用するにはログインが必要です。</div>;
    }

    const existingConversations = [...new Set(
        messages
            .filter(m => m.from === currentUser.username || m.to === currentUser.username)
            .map(m => m.from === currentUser.username ? m.to : m.from)
    )];

    const conversations = [...new Set([...(recipient ? [recipient] : []), ...existingConversations])]
      .filter(username => !currentUser?.blockedUsers?.includes(username));

    useEffect(() => {
        if (recipient) {
            setActiveConversation(recipient);
        } else if (conversations.length > 0 && !conversations.includes(activeConversation || '')) {
            setActiveConversation(conversations[0]);
        } else if (conversations.length === 0) {
            setActiveConversation(null);
        }
    }, [recipient, messages]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeConversation]);


    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (messageText.trim() && activeConversation) {
            onSendMessage({
                to: activeConversation,
                text: messageText,
            });
            setMessageText('');
        }
    };

    const currentChatMessages = messages.filter(m =>
        ((m.from === currentUser.username && m.to === activeConversation) ||
        (m.from === activeConversation && m.to === currentUser.username))
        && !currentUser?.blockedUsers?.includes(m.from)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return (
        <div className="w-full max-w-6xl mx-auto p-4 flex-grow">
            <div className="bg-white rounded-lg shadow-lg h-[85vh] flex flex-col">
                <header className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">ダイレクトメッセージ</h2>
                    <button onClick={onBack} className="text-sm text-blue-600 hover:underline">
                        戻る
                    </button>
                </header>
                <div className="flex-grow flex h-full overflow-hidden">
                    {/* User List */}
                    <aside className="w-1/3 border-r overflow-y-auto">
                        {conversations.length > 0 ? conversations.map(username => {
                            const user = usersMap.get(username);
                            return (
                                <div
                                    key={username}
                                    onClick={() => setActiveConversation(username)}
                                    className={`p-4 cursor-pointer hover:bg-gray-100 flex items-center gap-3 ${activeConversation === username ? 'bg-blue-100' : ''}`}
                                >
                                    {user?.profilePicture ? (
                                        <img src={user.profilePicture} alt={username} className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                            <UserIcon className="w-5 h-5 text-gray-600" />
                                        </div>
                                    )}
                                    <p className="font-semibold text-gray-800">{username}</p>
                                </div>
                            )
                        }) : (
                           <div className="p-4 text-center text-gray-500">
                               <p>まだメッセージのやり取りがありません。</p>
                           </div>
                        )}
                    </aside>
                    {/* Chat Area */}
                    <main className="w-2/3 flex flex-col">
                        {activeConversation ? (
                            <>
                                <div className="p-4 border-b">
                                    <h3 className="font-bold text-lg">{activeConversation}</h3>
                                </div>
                                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                                    {currentChatMessages.map(msg => {
                                        const fromUser = usersMap.get(msg.from);
                                        return (
                                            <div key={msg.id} className={`flex items-start gap-3 ${msg.from === currentUser.username ? 'justify-end' : ''}`}>
                                                {msg.from !== currentUser.username && (
                                                    fromUser?.profilePicture ? (
                                                        <img src={fromUser.profilePicture} alt={fromUser.username} className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <UserIcon className="w-5 h-5 text-gray-600" />
                                                        </div>
                                                    )
                                                )}
                                                <p className={`max-w-md p-3 rounded-lg ${msg.from === currentUser.username ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                                    {msg.text}
                                                </p>
                                            </div>
                                        )
                                    })}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="p-4 border-t bg-gray-50">
                                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            placeholder="メッセージを入力..."
                                            className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700">送信</button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-gray-500">
                                <p>ユーザーを選択して会話を開始してください。</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

// --- Auth, Admin & Settings Components ---
interface AuthField {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    autoFocus?: boolean;
    placeholder?: string;
}
const AuthForm = ({ title, buttonText, onSubmit, fields, setView, error, children, footerContent }: { title: string; buttonText: string; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; fields: AuthField[]; setView: (view: string) => void; error: string; children?: React.ReactNode; footerContent?: React.ReactNode }) => (
    <div className="w-full max-w-md mx-auto p-4 flex-grow flex flex-col justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{title}</h2>
            <form onSubmit={onSubmit}>
                {children}
                {fields.map(field => (
                    <div className="mb-4" key={field.id}>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={field.id}>
                            {field.label}
                        </label>
                        <input
                            id={field.id}
                            type={field.type}
                            value={field.value}
                            onChange={field.onChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            autoFocus={field.autoFocus}
                            placeholder={field.placeholder}
                            required
                        />
                    </div>
                ))}
                {error && <p className="text-red-500 text-xs italic mb-4 text-center">{error}</p>}
                <div className="flex items-center justify-between mt-6">
                    <button type="button" onClick={() => setView('main')} className="text-sm text-blue-600 hover:underline">
                        ポータルサイトに戻る
                    </button>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        {buttonText}
                    </button>
                </div>
            </form>
            {footerContent && <div className="text-center mt-4">{footerContent}</div>}
        </div>
    </div>
);


const AdminLogin = ({ onLoginSuccess, onBack }: { onLoginSuccess: (email: string) => void; onBack: () => void; }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (email.toLowerCase() === '0401az09@ymail.ne.jp' && password === '0401-0918') {
            onLoginSuccess(email);
        } else {
            setError('メールアドレスまたはパスワードが正しくありません。');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-4 flex-grow flex flex-col justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">管理人室ログイン</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            メールアドレス
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            autoFocus
                            placeholder="管理者用メールアドレス"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            パスワード
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="******************"
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs italic mb-4 text-center">{error}</p>}
                    <div className="flex items-center justify-between">
                         <button
                            type="button"
                            onClick={onBack}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            ポータルサイトに戻る
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            ログイン
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminRoom = ({ requests, onLogout, adminEmail }: { requests: CityRequest[]; onLogout: () => void; adminEmail: string | null; }) => {
    const sortedRequests = [...requests].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return (
         <div className="w-full max-w-6xl mx-auto p-4 flex-grow">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">管理人室 - 要望一覧票</h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-500">ログイン中</p>
                            <p className="text-sm font-medium text-gray-800">{adminEmail}</p>
                        </div>
                        <button onClick={onLogout} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            ログアウト
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold text-sm">日時</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm">要望内容</th>
                                <th className="text-center py-3 px-4 font-semibold text-sm">提出同意</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRequests.length > 0 ? sortedRequests.map((req, index) => (
                                <tr key={index} className="border-t hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm whitespace-nowrap">{new Date(req.timestamp).toLocaleString('ja-JP')}</td>
                                    <td className="py-3 px-4 text-sm whitespace-pre-wrap break-words">{req.text}</td>
                                    <td className="py-3 px-4 text-center text-sm">{req.consent ? '✔️' : '❌'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-4 text-gray-500">まだ要望はありません。</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const SettingsView = ({ currentUser, onBack, onUnblockUser, onExport, onImport, onUpdateProfilePicture }: { currentUser: User | null; onBack: () => void; onUnblockUser: (username: string) => void; onExport: () => void; onImport: (event: React.ChangeEvent<HTMLInputElement>) => void; onUpdateProfilePicture: (picture: string) => void; }) => {
    const [newProfilePic, setNewProfilePic] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!currentUser) {
        return <div className="p-4 text-center">設定を表示するにはログインが必要です。</div>;
    }
    
    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewProfilePic(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSaveProfilePic = () => {
        if (newProfilePic) {
            onUpdateProfilePicture(newProfilePic);
            setNewProfilePic(null);
             if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 flex-grow">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">アカウント設定</h2>
                    <button onClick={onBack} className="text-sm text-blue-600 hover:underline">戻る</button>
                </div>

                <div className="space-y-10">
                    {/* Profile Picture Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">プロフィール画像</h3>
                        <div className="flex items-center gap-4">
                            {currentUser.profilePicture ? (
                                <img src={currentUser.profilePicture} alt="現在のプロフィール画像" className="w-20 h-20 rounded-full object-cover" />
                            ) : (
                                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                                    <UserIcon className="w-10 h-10 text-gray-600"/>
                                </div>
                            )}
                            <label htmlFor="profile-pic-upload" className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center gap-2">
                               <CameraIcon className="w-5 h-5" />
                                画像を変更
                            </label>
                            <input id="profile-pic-upload" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleProfilePicChange} />
                        </div>
                        {newProfilePic && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">プレビュー:</p>
                                <img src={newProfilePic} alt="新しいプロフィール画像のプレビュー" className="w-20 h-20 rounded-full object-cover" />
                                <div className="mt-2">
                                     <button onClick={handleSaveProfilePic} className="px-4 py-1 text-sm bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">保存</button>
                                     <button onClick={() => setNewProfilePic(null)} className="ml-2 px-4 py-1 text-sm bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">キャンセル</button>
                                </div>
                            </div>
                        )}
                    </div>
                
                    {/* Blocked Users Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">ブロック中のユーザー</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {currentUser?.blockedUsers && currentUser.blockedUsers.length > 0 ? (
                                currentUser.blockedUsers.map(username => (
                                    <div key={username} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                                        <p className="font-medium text-gray-700">{username}</p>
                                        <button 
                                            onClick={() => onUnblockUser(username)}
                                            className="px-3 py-1 text-sm bg-gray-200 text-gray-800 font-semibold rounded-full hover:bg-gray-300 transition-colors"
                                        >
                                            ブロック解除
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm px-2">ブロック中のユーザーはいません。</p>
                            )}
                        </div>
                    </div>
                    {/* Data Management Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">データ管理</h3>
                        <p className="text-sm text-gray-600 mb-4">アカウント情報、投稿、メッセージなどの全データをバックアップしたり、復元したりできます。</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={onExport}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <FileDownIcon className="w-5 h-5" />
                                データをエクスポート
                            </button>
                            <label htmlFor="import-file" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer">
                                <FileUploadIcon className="w-5 h-5" />
                                データをインポート
                            </label>
                            <input type="file" id="import-file" accept=".json,application/json" className="hidden" onChange={onImport} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface UserProfileViewProps extends Omit<CommunityFeedProps, 'onSearch' | 'onSetFeedType' | 'feedType'> {
    username: string;
    onBack: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({
    username, usersMap, posts, comments, currentUser, onBack, onFollowUser, onStartDM, onBlockUser, onAddComment, onToggleLike, onToggleBookmark, onEditPost, onEditComment, onViewProfile
}) => {
    const userProfile = usersMap.get(username);
    if (!userProfile) {
        return (
            <div className="w-full max-w-4xl mx-auto p-4 flex-grow text-center">
                <p className="text-gray-600">ユーザーが見つかりません。</p>
                <button onClick={onBack} className="mt-4 text-sm text-blue-600 hover:underline">戻る</button>
            </div>
        );
    }
    const isFollowing = currentUser?.following?.includes(userProfile.username);
    const isSelf = currentUser?.username === userProfile.username;

    const userPosts = posts
        .filter(p => p.author === username)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <main className="w-full max-w-4xl mx-auto p-4 flex-grow">
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {userProfile.profilePicture ? (
                        <img src={userProfile.profilePicture} alt={userProfile.username} className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                        <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                            <UserIcon className="w-16 h-16 text-gray-600"/>
                        </div>
                    )}
                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-3xl font-bold text-gray-800">{userProfile.username}</h2>
                        {currentUser && !isSelf && (
                             <div className="mt-3 flex justify-center sm:justify-start items-center gap-2">
                                <button
                                  onClick={() => onStartDM(userProfile.username)}
                                  className="px-4 py-1.5 text-sm bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors"
                                >
                                    メッセージを送る
                                </button>
                                <button
                                  onClick={() => onFollowUser(userProfile.username)}
                                  className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${isFollowing ? 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                >
                                    {isFollowing ? 'フォロー中' : 'フォロー'}
                                </button>
                                <button
                                  onClick={() => onBlockUser(userProfile.username)}
                                  className="px-4 py-1.5 text-sm bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 transition-colors"
                                >
                                    ブロック
                                </button>
                             </div>
                        )}
                    </div>
                     <button onClick={onBack} className="text-sm text-blue-600 hover:underline self-start sm:self-center">フィードに戻る</button>
                </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-4">投稿一覧</h3>
            <div className="space-y-6">
                {userPosts.length > 0 ? userPosts.map(post => {
                    const postComments = comments.filter(c => c.postId === post.id && !currentUser?.blockedUsers?.includes(c.author));
                    const isBookmarked = currentUser?.bookmarkedPosts?.includes(post.id) ?? false;
                    return (
                        <PostCard
                            key={post.id}
                            post={post}
                            comments={postComments}
                            currentUser={currentUser}
                            usersMap={usersMap}
                            onFollowUser={onFollowUser}
                            onStartDM={onStartDM}
                            onBlockUser={onBlockUser}
                            onAddComment={onAddComment}
                            onToggleLike={onToggleLike}
                            onToggleBookmark={onToggleBookmark}
                            isBookmarked={isBookmarked}
                            onEditPost={onEditPost}
                            onEditComment={onEditComment}
                            onViewProfile={onViewProfile}
                        />
                    );
                }) : (
                    <div className="text-center py-10 px-6 bg-white rounded-lg shadow-lg">
                        <p className="text-gray-500">このユーザーはまだ投稿していません。</p>
                    </div>
                )}
            </div>
        </main>
    );
};


// --- Main App Component ---
const App = () => {
    const [view, setView] = useState('main'); // 'main', 'adminLogin', 'adminRoom', 'userLogin', 'signup', 'dm', 'settings', 'userProfile', 'passwordResetRequest', 'passwordReset', 'bookmarks'
    
    // Admin state
    const [adminEmail, setAdminEmail] = useState<string | null>(null);
    const [cityRequests, setCityRequests] = useState<CityRequest[]>(() => JSON.parse(localStorage.getItem('matsusakaCityRequests') || '[]'));
    useEffect(() => { localStorage.setItem('matsusakaCityRequests', JSON.stringify(cityRequests)) }, [cityRequests]);

    // User state
    const [users, setUsers] = useState<User[]>(() => {
        const stored = localStorage.getItem('matsusakaUsers');
        const parsed = stored ? JSON.parse(stored) : [];
        return parsed.map(u => ({
            ...u,
            following: u.following || [],
            blockedUsers: u.blockedUsers || [],
            bookmarkedPosts: u.bookmarkedPosts || [],
            profilePicture: u.profilePicture || null,
        }));
    });
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('matsusakaCurrentUser');
        const parsed = stored ? JSON.parse(stored) : null;
        if (parsed) {
            return {
                ...parsed,
                following: parsed.following || [],
                blockedUsers: parsed.blockedUsers || [],
                bookmarkedPosts: parsed.bookmarkedPosts || [],
                profilePicture: parsed.profilePicture || null,
            }
        }
        return null;
    });
    const [communityPosts, setCommunityPosts] = useState<Post[]>(() => JSON.parse(localStorage.getItem('matsusakaCommunityPosts') || '[]'));
    const [comments, setComments] = useState<Comment[]>(() => {
        const storedComments = JSON.parse(localStorage.getItem('matsusakaComments') || '[]');
        return storedComments.map(c => ({...c, parentId: c.parentId !== undefined ? c.parentId : null }));
    });
    const [directMessages, setDirectMessages] = useState<DirectMessage[]>(() => JSON.parse(localStorage.getItem('matsusakaDirectMessages') || '[]'));
    const [authError, setAuthError] = useState('');
    const [dmRecipient, setDmRecipient] = useState<string | null>(null);
    const [profileViewUsername, setProfileViewUsername] = useState<string | null>(null);
    const [passwordResetEmail, setPasswordResetEmail] = useState<string | null>(null);
    const [loginMessage, setLoginMessage] = useState('');

    useEffect(() => { localStorage.setItem('matsusakaUsers', JSON.stringify(users)) }, [users]);
    useEffect(() => { localStorage.setItem('matsusakaCurrentUser', JSON.stringify(currentUser)) }, [currentUser]);
    useEffect(() => { localStorage.setItem('matsusakaCommunityPosts', JSON.stringify(communityPosts)) }, [communityPosts]);
    useEffect(() => { localStorage.setItem('matsusakaComments', JSON.stringify(comments)) }, [comments]);
    useEffect(() => { localStorage.setItem('matsusakaDirectMessages', JSON.stringify(directMessages)) }, [directMessages]);
    
    // Feed state
    const [searchQuery, setSearchQuery] = useState('');
    const [feedType, setFeedType] = useState<'all' | 'following'>('all'); // 'all' or 'following'

    const usersMap = new Map(users.map(user => [user.username, user]));

    const filteredPosts = communityPosts
      .filter(post => {
        if (currentUser?.blockedUsers?.includes(post.author)) {
            return false;
        }
        const authorMatch = feedType === 'following' ? currentUser?.following?.includes(post.author) : true;
        const queryMatch = searchQuery ? post.content.toLowerCase().includes(searchQuery.toLowerCase()) : true;
        return authorMatch && queryMatch;
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());


    // User Auth Handlers
    const handleSignUp = (username, email, password) => {
        setAuthError('');
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            setAuthError('このメールアドレスは既に使用されています。');
            return;
        }
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            setAuthError('このユーザー名は既に使用されています。');
            return;
        }
        const newUser: User = { 
            username: username, 
            email: email, 
            password: password, 
            following: [],
            blockedUsers: [],
            bookmarkedPosts: [],
            profilePicture: null
        };
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        setView('main');
    };

    const handleUserLogin = (email, password) => {
        setAuthError('');
        setLoginMessage('');
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (user) {
            setCurrentUser(user);
            setView('main');
        } else {
            setAuthError('メールアドレスまたはパスワードが正しくありません。');
        }
    };
    
    const handleUserLogout = () => {
        setCurrentUser(null);
        setView('main');
    };
    
    const handlePasswordResetRequest = (email: string) => {
        setAuthError('');
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
            setPasswordResetEmail(email);
            setView('passwordReset');
        } else {
            setAuthError('このメールアドレスは登録されていません。');
        }
    };
    
    const handleUpdatePassword = (password: string) => {
        if (!passwordResetEmail) return;
        setUsers(prevUsers =>
            prevUsers.map(u =>
                u.email.toLowerCase() === passwordResetEmail.toLowerCase()
                    ? { ...u, password: password }
                    : u
            )
        );
        setPasswordResetEmail(null);
        setView('userLogin');
        setLoginMessage('パスワードが正常に更新されました。新しいパスワードでログインしてください。');
    };

    const handleUpdateProfilePicture = (newPicture: string) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, profilePicture: newPicture };
        setCurrentUser(updatedUser);
        setUsers(prevUsers => 
            prevUsers.map(u => u.username === currentUser.username ? updatedUser : u)
        );
        alert('プロフィール画像を更新しました。');
    };
    
    // Content Handlers
    const handleAddPost = (postData: { content: string; image: string | null; }) => {
        if (!currentUser) return;
        const newPost: Post = {
            id: Date.now(),
            author: currentUser.username,
            timestamp: new Date().toISOString(),
            likes: [],
            ...postData
        };
        setCommunityPosts(prev => [newPost, ...prev]);
    };

    const handleEditPost = ({ postId, content, image }: { postId: number; content: string; image?: string | null; }) => {
        setCommunityPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.id === postId) {
                    const updatedPost = { ...post, content: content };
                    if (image !== undefined) { // Check if image property was passed
                        updatedPost.image = image;
                    }
                    return updatedPost;
                }
                return post;
            })
        );
    };

    const handleAddComment = ({ postId, content, parentId = null }: { postId: number; content: string; parentId?: number | null; }) => {
        if (!currentUser) {
            alert("コメントするにはログインしてください。");
            return;
        }
        const newComment: Comment = {
            id: Date.now(),
            postId: postId,
            author: currentUser.username,
            content: content,
            timestamp: new Date().toISOString(),
            parentId: parentId,
        };
        setComments(prev => [...prev, newComment]);
    };

    const handleEditComment = ({ commentId, content }: { commentId: number; content: string; }) => {
        setComments(prev => prev.map(c => 
            c.id === commentId ? { ...c, content: content } : c
        ));
    };

    const handleToggleLike = (postId: number) => {
        if (!currentUser) {
            alert("いいねするにはログインしてください。");
            return;
        }
        setCommunityPosts(prevPosts => prevPosts.map(post => {
            if (post.id === postId) {
                const isLiked = post.likes.includes(currentUser.username);
                if (isLiked) {
                    return { ...post, likes: post.likes.filter(username => username !== currentUser.username) };
                } else {
                    return { ...post, likes: [...post.likes, currentUser.username] };
                }
            }
            return post;
        }));
    };
    
    const handleToggleBookmark = (postId: number) => {
        if (!currentUser) {
            alert("ブックマークするにはログインしてください。");
            return;
        }
        const isBookmarked = currentUser.bookmarkedPosts?.includes(postId);
        const updatedBookmarks = isBookmarked
            ? currentUser.bookmarkedPosts.filter(id => id !== postId)
            : [...(currentUser.bookmarkedPosts || []), postId];
        
        const updatedUser = { ...currentUser, bookmarkedPosts: updatedBookmarks };
        setCurrentUser(updatedUser);
        setUsers(prevUsers => prevUsers.map(u => u.username === currentUser.username ? updatedUser : u));
    };

    const handleFollowUser = (usernameToFollow: string) => {
        if (!currentUser) {
            alert("フォローするにはログインしてください。");
            return;
        }
        
        const isFollowing = currentUser.following?.includes(usernameToFollow);
        
        const updatedFollowing = isFollowing
            ? currentUser.following.filter(name => name !== usernameToFollow)
            : [...(currentUser.following || []), usernameToFollow];

        const updatedUser: User = { ...currentUser, following: updatedFollowing };
        setCurrentUser(updatedUser);
        
        setUsers(users.map(u => u.username === currentUser.username ? updatedUser : u));
    };

    const handleBlockUser = (usernameToBlock: string) => {
        if (!currentUser) return;
        if (currentUser.username === usernameToBlock) {
            alert("自分自身をブロックすることはできません。");
            return;
        }

        const updatedBlockedUsers = [...(currentUser.blockedUsers || []), usernameToBlock];
        const updatedUser: User = { ...currentUser, blockedUsers: updatedBlockedUsers };
        
        setCurrentUser(updatedUser);
        setUsers(users.map(u => u.username === currentUser.username ? updatedUser : u));
        
        if (profileViewUsername === usernameToBlock) {
             setView('main');
        }

        alert(`${usernameToBlock}さんをブロックしました。`);
    };

    const handleUnblockUser = (usernameToUnblock: string) => {
        if (!currentUser) return;
        
        const usernameToUpdate = currentUser.username;

        // Use functional updates for both currentUser and the master users list.
        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                blockedUsers: prevUser.blockedUsers?.filter(name => name !== usernameToUnblock) || [],
            };
        });
    
        setUsers(prevUsers => 
            prevUsers.map(u => {
                if (u.username === usernameToUpdate) {
                    return {
                        ...u,
                        blockedUsers: u.blockedUsers?.filter(name => name !== usernameToUnblock) || [],
                    };
                }
                return u;
            })
        );
    
        alert(`${usernameToUnblock}さんのブロックを解除しました。`);
    };

    const handleAddRequest = (requestData: CityRequest) => {
        setCityRequests(prev => [...prev, requestData]);
    };

    const handleSendDM = (messageData: { to: string; text: string; }) => {
        if (!currentUser) {
            alert("メッセージを送信するにはログインしてください。");
            return;
        }
        const newMessage: DirectMessage = {
            id: Date.now(),
            from: currentUser.username,
            to: messageData.to,
            text: messageData.text,
            timestamp: new Date().toISOString()
        };
        setDirectMessages(prev => [...prev, newMessage]);
    };
    
    const handleStartDM = (username: string) => {
      if (!currentUser) {
        alert("メッセージを送るにはログインしてください。");
        return;
      }
      if (currentUser.blockedUsers?.includes(username)) {
         alert("このユーザーはブロック中のため、メッセージを開始できません。");
         return;
      }
      setDmRecipient(username);
      setView('dm');
    };
    
    const handleViewProfile = (username: string) => {
        if (currentUser?.blockedUsers?.includes(username)) {
            alert("このユーザーはブロック中のため、プロフィールを表示できません。");
            return;
        }
        setProfileViewUsername(username);
        setView('userProfile');
    };

    // Admin Auth Handlers
    const handleAdminLoginSuccess = (email: string) => {
        setAdminEmail(email);
        setView('adminRoom');
    };

    const handleAdminLogout = () => {
        setAdminEmail(null);
        setView('main');
    };
    
    // Data Management Handlers
    const handleExportData = () => {
        try {
            const dataToExport = {
                matsusakaCityRequests: localStorage.getItem('matsusakaCityRequests') || '[]',
                matsusakaUsers: localStorage.getItem('matsusakaUsers') || '[]',
                matsusakaCurrentUser: localStorage.getItem('matsusakaCurrentUser') || 'null',
                matsusakaCommunityPosts: localStorage.getItem('matsusakaCommunityPosts') || '[]',
                matsusakaComments: localStorage.getItem('matsusakaComments') || '[]',
                matsusakaDirectMessages: localStorage.getItem('matsusakaDirectMessages') || '[]',
            };
            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'matsusaka_portal_backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('データのエクスポートが完了しました。');
        } catch (error) {
            console.error('Failed to export data:', error);
            alert('データのエクスポートに失敗しました。');
        }
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            alert('無効なファイル形式です。JSONファイルを選択してください。');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error('File could not be read.');
                
                const data = JSON.parse(text);
                const requiredKeys = ['matsusakaCityRequests', 'matsusakaUsers', 'matsusakaCurrentUser', 'matsusakaCommunityPosts', 'matsusakaComments', 'matsusakaDirectMessages'];
                const hasAllKeys = requiredKeys.every(key => key in data);

                if (!hasAllKeys) {
                    alert('ファイルの内容が正しくありません。有効なバックアップファイルを選択してください。');
                    return;
                }

                if (window.confirm('現在のデータを上書きして、インポートを実行しますか？この操作は元に戻せません。')) {
                    Object.keys(data).forEach(key => {
                        localStorage.setItem(key, data[key]);
                    });
                    alert('データのインポートが完了しました。ページをリロードします。');
                    window.location.reload();
                }
            } catch (error) {
                console.error('Failed to import data:', error);
                alert('データのインポートに失敗しました。ファイルが破損している可能性があります。');
            }
        };
        reader.readAsText(file);
        // Reset file input value to allow importing the same file again
        if (event.target) {
          event.target.value = '';
        }
    };


    // View Components
    const MainPortal = () => (
      <>
        <main className="w-full max-w-4xl mx-auto p-4 flex-grow">
            <div className="h-[80vh] min-h-[600px] mb-12">
                 <Chatbot currentUser={currentUser} />
            </div>

            <div className="space-y-8">
                 <CommunityPostForm onAddPost={handleAddPost} currentUser={currentUser} />
                 <CommunityFeed
                    posts={filteredPosts}
                    comments={comments}
                    currentUser={currentUser}
                    usersMap={usersMap}
                    onFollowUser={handleFollowUser}
                    onBlockUser={handleBlockUser}
                    onStartDM={handleStartDM}
                    onSearch={setSearchQuery}
                    onAddComment={handleAddComment}
                    onToggleLike={handleToggleLike}
                    onToggleBookmark={handleToggleBookmark}
                    onEditPost={handleEditPost}
                    onEditComment={handleEditComment}
                    onViewProfile={handleViewProfile}
                    onSetFeedType={(type) => {
                      if (!currentUser && type === 'following') {
                        alert("フォロー中の投稿を見るにはログインしてください。");
                        return;
                      }
                      setFeedType(type);
                    }}
                    feedType={feedType}
                 />
                 <CityRequestForm onAddRequest={handleAddRequest} />
            </div>
        </main>
        
        <footer className="w-full text-center py-5 bg-white border-t mt-8">
            <p className="text-sm text-gray-500 mb-2">&copy; 2025 松阪市民によるAI制作非公式ポータル. All rights reserved.</p>
            <button onClick={() => setView('adminLogin')} className="text-sm text-blue-600 hover:underline">
              管理者用ページ
            </button>
        </footer>
      </>
    );
    
    interface BookmarksViewProps extends Omit<CommunityFeedProps, 'onSearch' | 'onSetFeedType' | 'feedType'> {
      onBack: () => void;
    }
    
    const BookmarksView: React.FC<BookmarksViewProps> = ({ posts, currentUser, usersMap, comments, onBack, onFollowUser, onStartDM, onBlockUser, onAddComment, onToggleLike, onToggleBookmark, onEditPost, onEditComment, onViewProfile }) => {
        return (
             <main className="w-full max-w-4xl mx-auto p-4 flex-grow">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">ブックマーク</h2>
                    <button onClick={onBack} className="text-sm text-blue-600 hover:underline">フィードに戻る</button>
                </div>

                <div className="space-y-6">
                    {posts.length > 0 ? posts.map(post => {
                        const postComments = comments.filter(c => c.postId === post.id && !currentUser?.blockedUsers?.includes(c.author));
                        const isBookmarked = currentUser?.bookmarkedPosts?.includes(post.id) ?? false;
                        return (
                           <PostCard
                                key={post.id}
                                post={post}
                                comments={postComments}
                                currentUser={currentUser}
                                usersMap={usersMap}
                                onFollowUser={onFollowUser}
                                onStartDM={onStartDM}
                                onBlockUser={onBlockUser}
                                onAddComment={onAddComment}
                                onToggleLike={onToggleLike}
                                onToggleBookmark={onToggleBookmark}
                                isBookmarked={isBookmarked}
                                onEditPost={onEditPost}
                                onEditComment={onEditComment}
                                onViewProfile={onViewProfile}
                            />
                        )
                    }) : (
                        <div className="text-center py-10 px-6 bg-white rounded-lg shadow-lg">
                            <p className="text-gray-500">ブックマークした投稿はまだありません。</p>
                        </div>
                    )}
                </div>
             </main>
        );
    }
    
    const UserSignUpView = () => {
        const [username, setUsername] = useState('');
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');

        const localSubmit = (e) => {
            e.preventDefault();
            handleSignUp(username, email, password);
        };

        return <AuthForm
            title="新規アカウント登録"
            buttonText="同意して登録する"
            onSubmit={localSubmit}
            setView={setView}
            error={authError}
            fields={[
                { id: 'username', label: 'ユーザー名', type: 'text', value: username, onChange: e => setUsername(e.target.value), autoFocus: true, placeholder: '松阪 太郎' },
                { id: 'email', label: 'メールアドレス', type: 'email', value: email, onChange: e => setEmail(e.target.value), placeholder: 'email@example.com' },
                { id: 'password', label: 'パスワード', type: 'password', value: password, onChange: e => setPassword(e.target.value), placeholder: '••••••••' }
            ]}
            footerContent={
                <p className="text-sm text-gray-600">すでにアカウントをお持ちですか？ <button onClick={() => setView('userLogin')} className="text-blue-600 hover:underline">ログイン</button></p>
            }
        >
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm space-y-2 rounded-r-lg">
              <p className="font-bold">登録前にご確認ください</p>
              <ul className="list-disc list-inside space-y-1">
                  <li>アカウントは削除できません。</li>
                  <li>このサイトからの通知機能は一切ありません。</li>
                  <li>一度ユーザーをブロックすると、そのユーザーとのやり取り（投稿の閲覧、DM等）は、設定画面でブロックを解除するまで一切できなくなります。</li>
                  <li>このサイトには情報収集機能がないため紛争時の加害者アカウントへの罰則・開示請求等の特定はいたしかねます。</li>
                  <li>コミュニティへの投稿はAIの自動学習の対象になります。ですので、積極的な投稿はとても助かります。ご協力お願いいたします。</li>
              </ul>
          </div>
        </AuthForm>;
    };

    const UserLoginView = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        
        useEffect(() => { setAuthError('') }, []); // Clear error on view load

        const localSubmit = (e) => {
            e.preventDefault();
            handleUserLogin(email, password);
        };

        return <AuthForm
            title="ログイン"
            buttonText="ログインする"
            onSubmit={localSubmit}
            setView={setView}
            error={authError}
            fields={[
                { id: 'email', label: 'メールアドレス', type: 'email', value: email, onChange: e => setEmail(e.target.value), autoFocus: true, placeholder: 'email@example.com' },
                { id: 'password', label: 'パスワード', type: 'password', value: password, onChange: e => setPassword(e.target.value), placeholder: '••••••••' }
            ]}
            footerContent={
                <>
                    <p className="text-sm text-gray-600">アカウントをお持ちでないですか？ <button onClick={() => setView('signup')} className="text-blue-600 hover:underline">新規登録</button></p>
                    <p className="text-sm text-gray-600 mt-2">
                        <button onClick={() => setView('passwordResetRequest')} className="text-blue-600 hover:underline">パスワードを忘れましたか？</button>
                    </p>
                </>
            }
        >
            {loginMessage && <p className="text-green-600 text-sm mb-4 text-center">{loginMessage}</p>}
        </AuthForm>;
    };

    const PasswordResetRequestView = () => {
        const [email, setEmail] = useState('');
        useEffect(() => { setAuthError('') }, []);

        const localSubmit = (e) => {
            e.preventDefault();
            handlePasswordResetRequest(email);
        };
        
        return <AuthForm
            title="パスワード再設定"
            buttonText="送信"
            onSubmit={localSubmit}
            setView={setView}
            error={authError}
            fields={[{
                id: 'email', label: 'メールアドレス', type: 'email', value: email,
                onChange: e => setEmail(e.target.value), autoFocus: true, placeholder: '登録済みのメールアドレス'
            }]}
            footerContent={
                <p className="text-sm text-gray-600">
                    <button onClick={() => setView('userLogin')} className="text-blue-600 hover:underline">ログイン画面に戻る</button>
                </p>
            }
        >
            <p className="text-sm text-gray-600 mb-4">アカウントに登録されたメールアドレスを入力してください。パスワード再設定の手順に進みます。</p>
        </AuthForm>;
    };

    const PasswordResetView = () => {
        const [password, setPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [error, setError] = useState('');

        const localSubmit = (e) => {
            e.preventDefault();
            setError('');
            if (password.length < 6) {
                setError("パスワードは6文字以上で設定してください。");
                return;
            }
            if (password !== confirmPassword) {
                setError("パスワードが一致しません。");
                return;
            }
            handleUpdatePassword(password);
        };

        return <AuthForm
            title="新しいパスワードの設定"
            buttonText="パスワードを更新"
            onSubmit={localSubmit}
            setView={setView}
            error={error}
            fields={[
                { id: 'password', label: '新しいパスワード', type: 'password', value: password, onChange: e => setPassword(e.target.value), autoFocus: true, placeholder: '••••••••' },
                { id: 'confirmPassword', label: '新しいパスワード (確認)', type: 'password', value: confirmPassword, onChange: e => setConfirmPassword(e.target.value), placeholder: '••••••••' }
            ]}
        >
            <p className="text-sm text-gray-600 mb-4">アカウント <span className="font-bold">{passwordResetEmail}</span> の新しいパスワードを設定します。</p>
        </AuthForm>;
    };

    return (
        <div className="bg-slate-100 min-h-screen flex flex-col font-sans">
            <header className="w-full py-4 px-4 sm:px-6 bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                        <button onClick={() => setView('main')} className="text-left">
                          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight truncate">松阪市民ポータルサイト</h1>
                          <p className="hidden sm:block mt-1 text-sm text-gray-600">AIチャットで、知りたい情報に素早くアクセス。</p>
                        </button>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {currentUser ? (
                            <>
                                <button onClick={() => setView('bookmarks')} className="p-2 rounded-full hover:bg-gray-200" aria-label="ブックマーク一覧を開く">
                                    <BookmarkIconOutline className="w-6 h-6 text-gray-600" />
                                </button>
                                <button onClick={() => setView('dm')} className="p-2 rounded-full hover:bg-gray-200" aria-label="ダイレクトメッセージを開く">
                                    <MessageIcon className="w-6 h-6 text-gray-600" />
                                </button>
                                <button onClick={() => setView('settings')} className="p-2 rounded-full hover:bg-gray-200" aria-label="設定を開く">
                                    <SettingsIcon className="w-6 h-6 text-gray-600" />
                                </button>
                                <span className="font-semibold text-gray-700 hidden sm:inline">ようこそ、{currentUser.username}さん</span>
                                <button onClick={handleUserLogout} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors">
                                    ログアウト
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setView('userLogin')} className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors">
                                    ログイン
                                </button>
                                <button onClick={() => setView('signup')} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                                    新規登録
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>
            
            {view === 'main' && <MainPortal />}
            {view === 'adminLogin' && <AdminLogin onLoginSuccess={handleAdminLoginSuccess} onBack={() => setView('main')} />}
            {view === 'adminRoom' && <AdminRoom requests={cityRequests} onLogout={handleAdminLogout} adminEmail={adminEmail} />}
            {view === 'signup' && <UserSignUpView />}
            {view === 'userLogin' && <UserLoginView />}
            {view === 'passwordResetRequest' && <PasswordResetRequestView />}
            {view === 'passwordReset' && <PasswordResetView />}
            {view === 'bookmarks' && currentUser && <BookmarksView
                posts={communityPosts.filter(p => currentUser.bookmarkedPosts?.includes(p.id)).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())}
                comments={comments}
                currentUser={currentUser}
                usersMap={usersMap}
                onBack={() => setView('main')}
                onFollowUser={handleFollowUser}
                onStartDM={handleStartDM}
                onBlockUser={handleBlockUser}
                onAddComment={handleAddComment}
                onToggleLike={handleToggleLike}
                onToggleBookmark={handleToggleBookmark}
                onEditPost={handleEditPost}
                onEditComment={handleEditComment}
                onViewProfile={handleViewProfile}
            />}
            {view === 'userProfile' && profileViewUsername && <UserProfileView
                username={profileViewUsername}
                usersMap={usersMap}
                posts={communityPosts}
                comments={comments}
                currentUser={currentUser}
                onBack={() => setView('main')}
                onFollowUser={handleFollowUser}
                onStartDM={handleStartDM}
                onBlockUser={handleBlockUser}
                onAddComment={handleAddComment}
                onToggleLike={handleToggleLike}
                onToggleBookmark={handleToggleBookmark}
                onEditPost={handleEditPost}
                onEditComment={handleEditComment}
                onViewProfile={handleViewProfile}
            />}
            {view === 'dm' && <DirectMessageView 
                currentUser={currentUser}
                usersMap={usersMap}
                messages={directMessages} 
                onSendMessage={handleSendDM} 
                onBack={() => {
                    setView('main');
                    setDmRecipient(null);
                }} 
                recipient={dmRecipient}
            />}
            {view === 'settings' && <SettingsView 
                currentUser={currentUser} 
                onBack={() => setView('main')} 
                onUnblockUser={handleUnblockUser}
                onExport={handleExportData}
                onImport={handleImportData}
                onUpdateProfilePicture={handleUpdateProfilePicture}
            />}
        </div>
    );
};

// --- Mount Application ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
document.body.style.margin = '0';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
