# 第六章 框架开发实践

在第四章中，我们通过编写原生代码，实现了 ReAct、Plan-and-Solve 和 Reflection 这几种智能体的核心工作流。这个过程让我们对智能体的内在执行逻辑有了理解。在第五章，我们切换到"使用者"的视角，体验了低代码平台带来的便捷与高效。

本章的目标，是带大家用"开发者"的视角，亲手使用业界主流的智能体框架，构建可靠、可维护的智能体应用。我们会先聊清楚"为什么需要框架"，然后挑出三个最具代表性的框架——LangChain、AutoGen、CrewAI——通过"横评 + 跟着做"的方式，让你既看得懂差别，也跑得起来代码。

## 6.1 为什么从手写代码走向框架开发

在第四章中，我们写过一个 ReAct 智能体。代码不长，但里面有 while 循环、有工具调用、有状态管理、有日志打印——这些"重复性"的工作，只要换一个项目，几乎要重写一遍。

### 6.1.1 框架到底帮你干了哪些活

大白话定义：框架就是别人把"造智能体时大家都会写的那部分代码"打包成可复用的组件，你只需要把注意力放在"我这个智能体跟别人不一样的那部分"。

生活类比：你可以把"手写智能体"想象成"自己砌灶台做饭"——每道菜你都得从生火开始。框架就像"商用厨房"——灶台、抽油烟、冷藏、洗菜池都给你装好了，你只管切菜炒菜。第一个菜可能要适应一下，但第二十个菜就飞快了。

最小例子：手写 ReAct 时你要写主循环：
```python
while not done:
    thought = llm(messages)
    action = parse(thought)
    observation = tools[action].run()
    messages.append(observation)
```
而用 LangChain 之后，AgentExecutor 内部已经把这套循环封装好，你只需要：
```python
agent_executor = AgentExecutor(agent=agent, tools=tools)
agent_executor.invoke({"input": "北京明天天气怎么样？"})
```

和我有什么关系：如果你打算把智能体从"演示 demo"推进到"给老板看的生产系统"，框架能帮你省下至少 60% 的样板代码，更重要的是它带来统一的工程规范——统一的错误处理、统一的日志格式、统一的模型切换方式。一个 5 人小团队用框架协作，比 5 个人各写各的循环要可控得多。

### 6.1.2 三大框架横评：LangChain / AutoGen / CrewAI

目前主流的智能体框架很多，但若论"使用最广、上手最快、社区最活跃"，有三家不能不提：LangChain、AutoGen、CrewAI。

| 维度 | LangChain | AutoGen | CrewAI |
|------|-----------|---------|--------|
| 核心范式 | 链式组合（LCEL） + ReAct Agent | 多智能体对话（GroupChat） | 角色化任务委派（Role / Task / Crew） |
| 上手难度 | 中等（概念多） | 中等（异步调试要经验） | 较低（声明式，类 SQL 思路） |
| 适合场景 | 单智能体 + 工具 / RAG | 复杂对话协作 / 代码生成 | 流程化的"专家小组" |
| 学习曲线 | 陡（文档厚） | 中（概念少） | 平（API 简洁） |
| 国产生态 | 完善 | 完善 | 一般 |

大白话定义：LangChain 是一套"零件 + 组装线"，AutoGen 是一套"会开会的圆桌"，CrewAI 是一套"剧组式的工作流"。

生活类比：把造智能体比作拍一部电影——LangChain 像"特效公司"，给你各种绿幕、后期插件和素材库；AutoGen 像"编剧圆桌会"，几个 AI 编剧坐一起讨论剧本；CrewAI 像"导演喊 Action"，你事先定好"谁是演员、谁负责灯光、谁负责场务"，喊开机后大家按部就班干活。

最小例子：用三行话感受差别：
- LangChain：`prompt | llm | parser`，把提示词、模型、解析器串成管道。
- AutoGen：`user_proxy.initiate_chat(assistant, message=task)`，两个 AI 互相发消息。
- CrewAI：`Crew(agents=[...], tasks=[...]).kickoff()`，定义好角色和任务，自动跑完。

和我有什么关系：选错框架会让你在 3 个月后哭着返工。先用这个表对号入座：单兵作战 + 工具密集型选 LangChain；多方协作 + 决策不确定选 AutoGen；流程清晰 + 角色分明选 CrewAI。后面 6.4 节会给出更详细的选型决策树。

## 6.2 框架一：LangChain

LangChain 是最早把"用 Python 拼装 LLM 应用"做成标准范式的框架。它的目标不是"造一个最强的智能体"，而是"给你一堆零件，让你自由组合"。

### 6.2.1 LangChain 是什么：零件仓库 + 组装流水线

大白话定义：LangChain 是一个把"大模型、提示词、工具调用、记忆、文档检索"等所有 LLM 周边能力模块化的 Python 库。它本身不生产智能体，而是给你一堆可以任意拼装的"乐高积木"。

生活类比：把它想象成宜家——你买回家的不是成品家具，而是一块块板子和螺丝。LangChain 提供 Chain、Agent、Retriever、Tool、Memory 这些积木，你按业务逻辑把它们拼成最终的应用。优点是灵活，缺点是初学者可能会被一墙的零件吓到。

最小例子：5 行代码写一个翻译助手：
```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_template("把下面的话翻译成{language}：{text}")
llm = ChatOpenAI(model="gpt-4o-mini")
chain = prompt | llm
print(chain.invoke({"language": "英文", "text": "今天天气真好"}))
```

和我有什么关系：LangChain 是绝大多数"用 LLM 写应用"的入门选择。学会它，等于掌握了 80% 公司内部"AI 工具"项目的工程化套路——比如 RAG 检索增强、Agent 调用工具、结构化输出、对话记忆，这些都是 LangChain 的强项。

### 6.2.2 LangChain 核心组件：六大基石

LangChain 的模块很多，但核心可以归纳为六块。

大白话定义：六大基石分别是 Models（模型）、Prompts（提示词模板）、Chains（链）、Agents（智能体）、Tools（工具）、Memory（记忆）。

生活类比：把它想成"厨房六件套"——Models 是燃气灶（提供热源），Prompts 是菜谱（决定做什么菜），Chains 是流水线（洗切炒的顺序），Agents 是会看菜谱决定先做哪道菜的厨师，Tools 是厨具（锅铲、蒸笼），Memory 是冰箱（记住上次用了什么食材）。

最小例子：用六大基石搭一个"会查天气的助手"需要：
- Models：选 ChatOpenAI
- Prompts：定义带变量的系统提示
- Tools：定义一个 `get_weather(city)` 函数
- Agents：选 `create_tool_calling_agent` 风格的 Agent
- Chains：把 Agent 装进 `AgentExecutor`
- Memory：用 `ConversationBufferMemory` 记住对话

和我有什么关系：这六块对应着公司里"AI 应用开发工程师"日常打交道的全部对象：调模型是基本功，写好提示词能立刻看到效果，做 Chain 是绝大多数业务代码的形态，Agent 是进阶，Tool 是和真实世界打交道的接口，Memory 是产品体验的关键——这六块扎实了，你就能接住 90% 的 AI 应用需求。

### 6.2.3 LCEL：LangChain 的链式表达语言

LCEL（LangChain Expression Language）是 LangChain 0.1 之后主推的"用 `|` 把组件串起来"的写法。

大白话定义：LCEL 就是 Python 的"管道操作符"在 LLM 应用里的特化版。`prompt | llm | parser` 三段连写就是一个完整的链。

生活类比：它就像 Unix 命令行里的 `|`——`cat file | grep error | wc -l` 把三个命令串起来出结果。LCEL 让你 `prompt | llm | output_parser` 把三个 LangChain 组件串成一个可执行对象。

最小例子：把上面那个翻译助手"管道化"：
```python
from langchain_core.output_parsers import StrOutputParser
chain = prompt | llm | StrOutputParser()
print(chain.invoke({"language": "英文", "text": "今天天气真好"}))
```
`StrOutputParser` 把模型的 AIMessage 还原成纯字符串——这就是 LCEL 的精髓：每一步只关心"输入是什么、输出是什么"，中间过程自动衔接。

和我有什么关系：学会 LCEL 是"读懂 LangChain 现代代码"的前提。现在网上 80% 的 LangChain 教程都默认你会 `|` 管道写法，不学 LCEL 就像不会用管道符的 Linux 用户——能跑，但很累。

### 6.2.4 跟着做：用 LangChain 写一个 RAG

RAG（Retrieval-Augmented Generation，检索增强生成）是企业里最常见的"用 LLM 答专业问题"模式——让模型先在文档库里检索相关内容，再结合检索结果回答。

大白话定义：RAG = 检索（Retrieval）+ 增强（Augment）+ 生成（Generate）。先从知识库里"翻书"，把找到的段落塞进提示词，再让 LLM 总结成自然语言回答。

生活类比：RAG 像开卷考试——学生（LLM）平时记不住所有知识没关系，发卷时附上几本参考书（向量数据库），让学生"带着资料答卷"。这样既不用把所有知识都塞进模型（成本低），又能回答最新、最专的问题（效果好）。

最小例子：一个最小可跑的 RAG：
```python
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

# 1. 加载并切分文档
docs = TextLoader("公司年报.txt").load()
chunks = RecursiveCharacterTextSplitter(chunk_size=500).split_documents(docs)

# 2. 向量化并存入向量库
vectorstore = FAISS.from_documents(chunks, OpenAIEmbeddings())
retriever = vectorstore.as_retriever()

# 3. 拼装 RAG 链
prompt = ChatPromptTemplate.from_template(
    "基于以下资料回答问题：\n{context}\n\n问题：{question}"
)
rag_chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt | ChatOpenAI(model="gpt-4o-mini")
)
print(rag_chain.invoke("公司去年的营收是多少？"))
```

和我有什么关系：RAG 是企业 AI 项目"第一站"。无论你是给 HR 部门做政策问答助手、给销售做产品手册查询、给客服做 FAQ 机器人，90% 都是 RAG 套路。把上面这个最小例子吃透，再换成 Pinecone、Milvus 不同的向量库就是半小时的事。

### 6.2.5 RAG 的进阶：评估、Hybrid Search、Re-ranking

最小例子只能跑起来，但生产环境的 RAG 至少要考虑三件事。

大白话定义：1）评估：怎么知道回答"对不对"；2）Hybrid Search：把关键词检索和向量检索混着用；3）Re-ranking：检索后用更强的模型重新排序，挑出最相关的 Top-K。

生活类比：评估像"考试出题老师"——你得有一份标准答案集，定期给 RAG 系统做"模拟考"，看它的回答是不是真的抓住了原文。Hybrid Search 像"图书馆双检索"——既用书名目录查（关键词），又用内容摘要查（语义）。Re-ranking 像"二次筛选"——先召回 100 篇，再用更精准的模型挑出前 5 篇。

最小例子：评估最简版本——用 RAGAS 库：
```python
from ragas import evaluate
from datasets import Dataset
dataset = Dataset.from_dict({
    "question": ["公司去年的营收是多少？"],
    "contexts": [["2023年公司营收为120亿元..."]],
    "answer": ["公司去年营收为120亿元。"],
    "ground_truth": ["120亿元"]
})
result = evaluate(dataset)
```

和我有什么关系：演示 Demo 跑通很容易，但让 RAG 真正"可用"的关键就在这三个进阶能力。学会它们，你就从"能跑"跨到"能交付"，这是初级和中级 AI 工程师的分水岭。

## 6.3 框架二：AutoGen

如果说 LangChain 的关键词是"组装"，那 AutoGen 的关键词就是"对话"。

### 6.3.1 AutoGen 是什么：会开会的智能体团队

大白话定义：AutoGen 是微软开源的"以多智能体对话为核心"的多智能体框架。你定义若干个有角色的 Agent（用户代理、助手、专家等），它们通过互相发消息来协作完成任务。

生活类比：把 AutoGen 想象成"圆桌会议室"——你不用管会议流程怎么走，你只需要告诉每把椅子后面坐的人"你是谁、你负责什么"。会议（GroupChat）开始后，它们会按规则轮流发言、自动决定下一步让谁说话。

最小例子：让一个"产品经理"和一个"工程师"协作写需求文档：
```python
from autogen import AssistantAgent, UserProxyAgent

pm = AssistantAgent("ProductManager", llm_config={"model": "gpt-4o-mini"})
engineer = AssistantAgent("Engineer", llm_config={"model": "gpt-4o-mini"})
user = UserProxyAgent("User", human_input_mode="TERMINATE")

user.initiate_chat(pm, message="帮我写一个登录功能的需求文档")
pm.initiate_chat(engineer, message="根据需求文档给出技术方案")
```

和我有什么关系：AutoGen 适合"任务需要多个 AI 互相推敲"的场景——比如让一个 AI 写代码、另一个 AI 评审、第三个 AI 测试。这种"自检式"工作流是它最大的卖点，也是企业里自动化代码生成的核心套路。

### 6.3.2 AutoGen 多智能体对话：GroupChat 机制

AutoGen 的核心是 GroupChat 模式。

大白话定义：GroupChat 是一种"多个 Agent 共享一个聊天频道、按规则决定谁下一句说话"的协作模式。规则可以是顺序轮询、可以是管理者指派、可以是函数动态判断。

生活类比：它像公司里开"站会"——所有 Agent 都在同一个会议室里，但谁发言由"主持人"决定。主持人可以是固定的轮询（按顺序来），也可以是 LLM 充当"会议主持"（看上下文决定让谁接话）。

最小例子：典型 GroupChat 配置：
```python
from autogen import GroupChat, GroupChatManager

groupchat = GroupChat(
    agents=[user, pm, engineer, reviewer],
    messages=[],
    max_round=10,
    speaker_selection_method="round_robin",  # 或 "auto" 让 LLM 选
)
manager = GroupChatManager(groupchat=groupchat, llm_config={"model": "gpt-4o-mini"})
user.initiate_chat(manager, message="开发一个计算器 App")
```

和我有什么关系：GroupChat 模式让"复杂任务自动分工"成为可能。现实里很多项目并不像流水线那样一环扣一环，而更像"几个人边讨论边出方案"——GroupChat 模拟的就是这种"边聊边推进"的工作方式。

### 6.3.3 跟着做：AutoGen 跑多智能体辩论

我们用 AutoGen 实现一个"正反方辩论赛"——让两个 AI 围绕一个辩题正反论证，再让一个裁判 AI 给出胜负。

大白话定义：辩论赛 = 三个 Agent：正方、反方、裁判。它们在 GroupChat 里轮流发言，正反方各陈述观点，裁判综合判断。

生活类比：像综艺节目的辩论节目——主持人宣布辩题，正方一辩、反方一辩、双方二辩、结辩陈词，裁判最后打分。我们用 AutoGen 把"主持人"和"裁判"都换成 AI，让辩论全程自动化。

最小例子：
```python
positive = AssistantAgent("Positive", system_message="你是正方，支持'AI 会取代人类工作'，每次发言给一个新论据。")
negative = AssistantAgent("Negative", system_message="你是反方，反对'AI 会取代人类工作'，每次发言反驳正方。")
judge = AssistantAgent("Judge", system_message="你是裁判，听完辩论后给出胜负判断和理由。")

groupchat = GroupChat(agents=[positive, negative, judge], max_round=6)
manager = GroupChatManager(groupchat=groupchat, llm_config={"model": "gpt-4o-mini"})
positive.initiate_chat(manager, message="辩题：AI 会取代人类工作。请开始辩论。")
```

和我有什么关系：辩论赛是"验证 AutoGen 协作"的最经典 Demo，能直观看到三个 AI 互相引用对方的观点反驳——这正是 AutoGen "以对话驱动协作"精髓的体现。学完这个案例，你就掌握了"用 AutoGen 模拟多视角分析问题"的能力，可用于市场调研、风险评估、多方决策辅助等真实场景。

### 6.3.4 AutoGen 的终止条件与人机协作

跑过 AutoGen 的同学都会遇到一个灵魂问题："什么时候让对话停下来？"

大白话定义：终止条件是"判断对话何时结束"的规则。AutoGen 支持关键词终止（如出现 TERMINATE）、最大轮次终止（max_round）、函数终止（自定义判断）等。

生活类比：终止条件像"闹钟"——你不能让一群 AI 一直聊下去（费钱），也不能太早打断（任务没完成）。常见的"闹钟"有三种：1）发现关键词就停；2）轮次用完就停；3）看到目标结果就停。

最小例子：组合使用多种终止条件：
```python
from autogen import GroupChat, GroupChatManager
from autogen.agentchat.contrib.retrieve_user_proxy_agent import RetrieveUserProxyAgent

groupchat = GroupChat(
    agents=[user, pm, engineer],
    max_round=20,
    is_termination_msg=lambda x: "TERMINATE" in x.get("content", ""),
)
```

人机协作方面，UserProxyAgent 是个关键设计：它可以"在关键节点暂停，让真人介入"——例如让 AI 写完代码后停下，等真人确认再继续执行。

和我有什么关系：终止条件是 AutoGen 生产化的"必经一课"。没有它，你的天价 API 账单可能一夜归零；配好它，你可以放心让 AutoGen 跑一晚上、第二天来看结果。

## 6.4 框架三：CrewAI

如果说 AutoGen 是"会议模式"，那 CrewAI 就是"剧组模式"。

### 6.4.1 CrewAI 是什么：剧组式的角色分工

大白话定义：CrewAI 是一个"以角色和任务为核心"的多智能体框架。你定义 Agent（角色）、Task（任务）、Crew（剧组），三步就能让一群 AI 协同完成一件大事。

生活类比：拍电影时，剧组里有导演、演员、摄影、灯光、剪辑——每个人都知道自己该干嘛。CrewAI 把这种"事先定好角色、按流程推进"的工作方式抽象出来：每个 Agent 是一个"演员"（带角色、目标、背景故事），每条 Task 是"一场戏"（带描述、输入、输出），整个 Crew 是"开机信号"。

最小例子：让两个 AI 协作写一篇博客：
```python
from crewai import Agent, Task, Crew

researcher = Agent(role="研究员", goal="搜集资料", backstory="资深行业分析师")
writer = Agent(role="作家", goal="写文章", backstory="擅长把复杂问题讲明白")

task1 = Task(description="研究 AI Agent 的最新进展", agent=researcher)
task2 = Task(description="基于资料写一篇 800 字博客", agent=writer)

crew = Crew(agents=[researcher, writer], tasks=[task1, task2])
crew.kickoff()
```

和我有什么关系：CrewAI 的 API 是三者里最"声明式"的——你不用管"它们怎么聊"，只要把"谁做什么"列清楚就行。对产品经理、业务分析师这种"懂业务、不想写复杂代码"的角色特别友好。

### 6.4.2 CrewAI 三大核心：Agent / Task / Crew

CrewAI 的设计哲学就浓缩在这三个对象里。

大白话定义：Agent = 一个人（有名字、角色、目标、背景故事、可用工具）；Task = 一件事（有描述、谁来做、产出什么）；Crew = 一个剧组（有哪些人、要做哪些事、按什么顺序）。

生活类比：想象你在排一出话剧——先在"选角表"上写好每个角色（Agent），再在"剧本"里写好每场戏（Task），最后在"剧组工作单"上列出谁参演、演什么戏、按什么顺序（Crew）。CrewAI 帮你把这三张表用代码写出来，然后一键开演。

最小例子：上面那个例子就是完整的 Agent / Task / Crew 三件套。深入一点的版本：
```python
researcher = Agent(
    role="研究员",
    goal="搜集并整理关于{topic}的最新资料",
    backstory="你是一个 10 年经验的行业研究员",
    tools=[search_tool, scrape_tool],   # 也能给 Agent 配工具
    verbose=True
)
task1 = Task(
    description="研究关于{topic}的 3 个关键趋势",
    expected_output="一份 500 字的趋势报告",
    agent=researcher,
    output_file="research.md"           # 直接把结果落盘
)
```

和我有什么关系：理解这三个对象，就理解了 CrewAI 90% 的能力。剩下的 10% 是"流程控制"（sequential 还是 hierarchical），属于进阶选项。

### 6.4.3 跟着做：CrewAI 搭三人团队

我们搭一个"内容创作三人组"：研究员、写手、编辑，让它们协作产出一篇可发布的博客。

大白话定义：三人团队 = 三个 Agent + 三个 Task + 一个 Crew，按顺序跑：先研究、再写初稿、最后润色。

生活类比：这就是一家小型内容工作室的标准流程——研究员调研、写手写作、编辑校对。我们用代码把这个流程"自动化"，让 AI 团队 24 小时不间断出稿。

最小例子：
```python
from crewai import Agent, Task, Crew
from langchain_community.tools import DuckDuckGoSearchRun

search = DuckDuckGoSearchRun()

researcher = Agent(role="研究员", goal="找出{topic}的关键信息", tools=[search], backstory="擅长快速调研")
writer = Agent(role="写手", goal="根据资料写一篇 1000 字博客", backstory="擅长把复杂概念讲明白")
editor = Agent(role="编辑", goal="把博客润色到可发布水平", backstory="对文字质量极度挑剔")

t1 = Task(description="调研 {topic} 的 3 个核心观点", agent=researcher)
t2 = Task(description="基于研究写一篇博客", agent=writer)
t3 = Task(description="润色并最终定稿", agent=editor, output_file="final.md")

crew = Crew(agents=[researcher, writer, editor], tasks=[t1, t2, t3], verbose=True)
result = crew.kickoff(inputs={"topic": "LangChain 与 LlamaIndex 的差异"})
```

和我有什么关系：内容生产是"AI 自动化的第一战场"——市场营销、自媒体、企业内训都在抢着做。掌握这个三人组模板，你就能快速复制出"研报组""课程组""剧本组"等各种自动化产线。

## 6.5 三大框架对比与选型

三大框架各有擅长，但面对真实项目，你得会选。

### 6.5.1 三大框架 API 风格对比

大白话定义：LangChain 像"乐高"，AutoGen 像"圆桌会议"，CrewAI 像"剧组"——三种 API 哲学，三种不同的思维方式。

生活类比：选 API 风格就像选交通工具——乐高像自行车，灵活但要自己组装；圆桌会议像商务车，能载多人但要学驾驶；剧组像观光大巴，路线固定但一坐就走。三者没有绝对好坏，看你的目的地和驾驶水平。

最小例子：同样是"让 AI 查天气"：
- LangChain（Agent 写法）：定义 Tool → 定义 Agent → AgentExecutor 执行
- AutoGen：定义带工具的 AssistantAgent → UserProxyAgent 发起对话
- CrewAI：定义带工具的 Agent → Task 描述"查天气" → Crew.kickoff

和我有什么关系：理解三者 API 哲学的差异，能让你在不同团队、不同项目里快速切换。今天公司项目用 LangChain，明天接手的项目可能用 CrewAI——一通百通。

### 6.5.2 框架选型决策树

选框架不是"挑最强的"，而是"挑最合适的"。

大白话定义：决策树 = 一连串是/否问题，根据答案分支落到最终推荐。框架选型决策树就是把"项目特征"映射到"推荐框架"的速查表。

生活类比：决策树像"医院分诊台"——护士先问你"哪里不舒服"（症状），根据你的回答告诉你去哪个科（推荐）。框架决策树做的事一模一样：先问"你的项目像流水线还是像会议"（特征），再告诉你用 LangChain 还是 AutoGen（推荐）。

最小例子（决策表）：

| 你的项目特征 | 推荐框架 |
|------------|---------|
| 单个 Agent + 多个工具 | LangChain |
| 需要 RAG / 文档问答 | LangChain |
| 多个 AI 互相讨论、决策 | AutoGen |
| 流程清晰、角色分明 | CrewAI |
| 重视声明式、易上手 | CrewAI |
| 需要复杂异步与并发 | AutoGen |
| 项目需要快速出 PoC | CrewAI |
| 项目需要工程化深度 | LangChain |

和我有什么关系：决策树能帮你"5 分钟拍板"。在没有现成标准时，决策树就是你向团队、向老板汇报选型时最有说服力的"证据"。

### 6.5.3 框架常见踩坑与排雷指南

无论选哪个框架，都有一些"通病"。

大白话定义：踩坑 = 别人替你踩过的雷，你还没遇到就先知道。常见三大坑：1）Token 失控（一个长任务跑出天价账单）；2）循环死锁（两个 AI 互让对方先说）；3）角色越界（研究员开始写代码，工程师开始做决策）。

生活类比：踩坑像开车——新手不看后视镜会撞，老司机根据经验提前避让。框架的"老司机经验"通常藏在三个地方：官方文档的 best practice、GitHub 的 issue 区、社区的"避坑指南"博客。

最小例子：解决 Token 失控——加 max_round + 加超时：
```python
# LangChain
agent_executor = AgentExecutor(agent=agent, tools=tools, max_iterations=5)
# AutoGen
groupchat = GroupChat(agents=[...], max_round=10, timeout=600)
# CrewAI
crew = Crew(agents=[...], tasks=[...], max_rpm=10)  # 每分钟最多 10 次调用
```

和我有什么关系：踩坑的成本在公司里是"钱 + 工期 + 老板的耐心"。提前知道三大坑，能让你在第一次跑框架时就配好"安全网"。

## 6.6 框架选型与原型验证

选型不止是"看决策树"，更要用原型验证。

### 6.6.1 国产模型与框架对接

LangChain、AutoGen、CrewAI 都默认走 OpenAI 协议，国内项目更多用 DeepSeek、通义千问、文心一言。

大白话定义：所谓"OpenAI 协议"就是调用大模型的一种"标准接口格式"——只要目标模型兼容这个协议，就能直接换上来用。

生活类比：它像"USB-C 接口"——你的电脑（框架）用的是 USB-C，只要手机（模型）也支持 USB-C（OpenAI 协议），就能直接连。DeepSeek、通义千问等国产模型都提供了 OpenAI 兼容接口。

最小例子：把 LangChain 切到 DeepSeek：
```python
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1"
)
```
其他两个框架的切换思路完全一样——只要换 base_url 和 model 名字。

和我有什么关系：国内项目几乎一定会涉及国产模型。掌握这个"三行切换"的技巧，你就能在不同模型之间做对比实验、找性价比最高的那个。

### 6.6.2 框架选型与原型验证

选型不能光看文档，要跑出原型对比。

大白话定义：原型验证（PoC）= 用最小的代码、最短的时间，把"能不能跑通"验证一遍。框架选型的 PoC 通常要回答三个问题：1）能不能跑通业务核心场景；2）改起来是否灵活；3）性能与成本是否可接受。

生活类比：买衣服不能只看图片，得试穿。框架 PoC 就是"AI 框架的试衣间"——同一个任务，用 LangChain 写一遍、用 AutoGen 写一遍、用 CrewAI 写一遍，再决定留下谁。

最小例子：用一个"查天气 + 写邮件"的简单任务做 PoC：
- LangChain 写法：5 分钟搞定，但邮件风格需要自己调提示词
- AutoGen 写法：8 分钟搞定，多智能体让"调研 + 写邮件"分工更自然
- CrewAI 写法：6 分钟搞定，声明式 API 最直接

和我有什么关系：PoC 思维是"AI 工程师"的核心方法论。需求一来别急着写，先用三个框架各写个 20 行代码，再拍板选哪个。

## 6.7 本章小结

本章我们一起走了"框架开发"这条主干道。

我们从"为什么需要框架"出发，理解了框架解决的是"重复劳动 + 工程规范"两个根本问题。然后聚焦三个最主流的框架——LangChain、AutoGen、CrewAI——通过"横评 + 跟着做"的方式，让大家既看到了它们的差异，也亲手写出了能跑的代码。

回头看：LangChain 像"乐高"——零件多、自由度高，适合单智能体 + 工具密集型场景；AutoGen 像"圆桌会议"——多智能体互相推敲，适合需要多方协作与决策的场景；CrewAI 像"剧组"——角色与任务清晰，适合流程化、可复用的产线场景。三者没有绝对优劣，合适的才是最好的。

更重要的是：选框架不是终点，而是"工程化"的开端。下一步我们要学的，是怎么把这些框架搭起来的应用，推进到生产环境——监控、日志、A/B 测试、灰度发布、成本控制——这些是真正区分"AI Demo"和"AI 产品"的能力。

在下一章中，我们将进入本教程的核心内容，从零开始，亲手构建一个属于我们自己的智能体框架，将所有理论与实践融会贯通。

## 习题

1. 本章介绍了三个主流框架：LangChain、AutoGen、CrewAI。请从"API 哲学""核心范式""典型场景"三个维度做一张对比表，并选择你最熟悉的一个，写一段 100 字的评价。

2. LangChain 中的 LCEL（LangChain Expression Language）有什么优势？为什么现在的 LangChain 教程几乎都用 `|` 管道写法？请写一段 200 字以内的解释。

3. 在 6.2.4 节中，我们写了一个最小可跑的 RAG。假设你要把它升级为生产可用的版本，至少需要做哪三件事？请分别说明理由。

4. AutoGen 的 GroupChat 有多种 speaker_selection_method（如 round_robin、auto、manual），它们各自的适用场景是什么？请用"项目特征 → 推荐方法"的方式列出至少三种组合。

5. 在 6.4.3 节中，我们用 CrewAI 搭了一个"内容创作三人组"。请基于这个案例回答：
   - 如果任务需要"编辑不满意就重写"，CrewAI 怎么实现？需要修改哪些参数？
   - 如果要扩展为"四人团队"（加一个"视觉设计师"），最小代码改动是什么？

6. 假设你是某 AI 创业公司的技术负责人，公司计划开发以下三个产品：
   - 产品 A：企业内部知识库问答机器人
   - 产品 B：自动化市场调研报告生成器
   - 产品 C：智能编程助手（多 AI 协作生成代码）

   请为每个产品推荐最合适的框架，并详细说明理由（建议用"决策树"思路作答）。

## 参考文献

[1] Chase H. LangChain [EB/OL]. (2022). https://github.com/langchain-ai/langchain.

[2] Wu Q, Bansal G, Zhang J, et al. Autogen: Enabling next-gen LLM applications via multi-agent conversations[C]//First Conference on Language Modeling. 2024.

[3] CrewAI Inc. CrewAI [EB/OL]. (2024). https://github.com/joaomdmoura/crewAI.

[4] Liu J. LCEL 编程范式 [EB/OL]. (2024). https://python.langchain.com/docs/concepts/lcel/.
