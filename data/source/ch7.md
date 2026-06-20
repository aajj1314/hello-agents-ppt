第七章 构建你的智能体框架

在前面的章节中，我们已经学习了智能体的基本概念、经典范式和主流框架。从本章开始，我们将进入一个更具挑战也更有价值的阶段：从零开始，逐步构建一个属于自己的轻量级智能体框架——HelloAgents。这个框架会贯穿后续章节，为记忆系统、RAG、上下文工程、通信协议和实战项目提供统一的技术底座。

### 7.1 框架整体架构设计

在动手写代码之前，我们需要先回答两个根本问题：为什么要自己建框架？我们要建一个什么样的框架？

### 7.1.1 为什么要自建框架？

**大白话定义**：自己搭框架就像自己造一辆自行车，每个零件怎么转、为什么这样设计，你心里全都有数。用现成的框架是“会用”，自建框架是“懂原理”。

**生活类比**：学做菜时，看菜谱能做出菜；但自己搭灶台、控火候，才真正理解烹饪的本质。遇到食材不够、口味特殊时，你才能自由调整。

**最小例子**：用 LangChain 三行代码就能调工具，但你可能不知道工具调用提示词是怎么写的、模型返回结果又是如何解析成真正函数执行的。自建框架时，这些细节全都要亲手实现一遍。

**和我有什么关系**：本书后面的 CH13 旅行助手、CH14 DeepResearch 等实战项目，都需要根据业务改框架行为。不懂内部机制，就只能被框架牵着走；懂了，才能按需定制。

市面上的成熟框架虽然功能丰富，但对学习者来说存在四个典型痛点：

1. **过度抽象的复杂性**：为了追求通用性，LangChain 等框架引入了大量抽象层和配置选项，初学者往往要理解十几个概念才能完成简单任务。
2. **快速迭代带来的不稳定性**：商业化框架 API 变更频繁，升级后旧代码可能无法运行，维护成本高。
3. **黑盒化的实现逻辑**：核心逻辑封装严密，开发者难以理解 Agent 的内部工作机制，遇到问题时只能依赖文档和社区。
4. **依赖关系的复杂性**：成熟框架携带大量依赖包，安装体积庞大，容易出现依赖冲突。

自建框架能让我们完成从“使用者”到“构建者”的跃迁：真正理解 Agent 的思考过程、工具调用机制和各种设计模式；获得完全的控制权，按业务精确调优；同时锻炼模块化设计、接口抽象和错误处理等软件工程能力。

### 7.1.2 HelloAgents 设计理念

**大白话定义**：HelloAgents 想做一个“像乐高说明书一样清楚”的框架，不要求你一次性学会所有零件，而是让你一块块拼出智能体。

**生活类比**：复杂框架像一把瑞士军刀，功能很多，但初学者常常找不到该用哪把刀；HelloAgents 则像一个工具箱，每件工具位置固定、用途单一，拿起就会用。

**最小例子**：在别的框架里，你要先搞懂 Chain、Retriever、Memory、Agent 等十几个概念才能动手；HelloAgents 的核心原则只有一条——“除了 Agent 基类，万物皆为工具”。

**和我有什么关系**：这个设计理念保证你在 CH8 学记忆/RAG、CH9 学上下文工程时，只需要新增“工具”或“消息处理”模块，不用推倒重来。

HelloAgents 围绕四个核心设计理念展开：

1. **轻量级与教学友好的平衡**：核心代码按章节区分，任何有编程基础的开发者都能在合理时间内读懂；依赖极简，除了 OpenAI SDK 和少量基础库外不引入重型依赖。
2. **基于标准 API 的务实选择**：基于 OpenAI 兼容接口构建，迁移成本低，学习曲线平缓。
3. **渐进式学习路径**：每一章都会对应一个可 pip 安装的历史版本，你可以按自己的节奏逐步升级。
4. **统一的“工具”抽象：万物皆为工具**：Memory、RAG、MCP、搜索等模块都被抽象为 Tool，让学习者回归到“智能体调用工具”这一最直观的核心逻辑。

### 7.2 LLM 客户端

**大白话定义**：LLM 客户端就是智能体的“嘴巴和耳朵”，负责把问题传给大模型，再把回答带回来；同时它还要兼容不同厂商的“方言”。

**生活类比**：就像手机里的通话 App，不管你打给移动、联通还是微信语音，拨号、接听、挂断的界面和操作都差不多。

**最小例子**：`llm = HelloAgentsLLM()` 会自动读取 `.env` 里的 API Key，一行代码就能在 OpenAI、ModelScope、智谱 AI、本地 VLLM/Ollama 之间切换。

**和我有什么关系**：CH13 旅行助手需要联网查天气、CH14 DeepResearch 要调用搜索，都离不开这个统一接口。只有接口稳定，后面换模型、换供应商才不会大改代码。

#### 7.2.1 多提供商支持

HelloAgentsLLM 通过 `provider` 参数和环境变量，内置支持 OpenAI、ModelScope、智谱 AI 等云端服务商。你需要做的只是在 `.env` 中配置对应密钥：

```python
# .env
OPENAI_API_KEY=sk-xxx
# 或
MODELSCOPE_API_KEY=ms-xxx
LLM_MODEL_ID=Qwen/Qwen2.5-VL-72B-Instruct
```

代码层面无需改动：

```python
from hello_agents import HelloAgentsLLM
from dotenv import load_dotenv

load_dotenv()
llm = HelloAgentsLLM()
```

如果你需要接入新的服务商（如 Gemini、Anthropic），可以通过继承 HelloAgentsLLM 并重写 `__init__` 来实现扩展，而无需修改库源码。

#### 7.2.2 本地模型与自动检测

除了云端 API，HelloAgentsLLM 还支持本地部署方案：

- **VLLM**：通过 PagedAttention 等技术实现高性能推理，启动后暴露兼容 OpenAI 的 API。
- **Ollama**：一键下载并运行开源模型，适合快速体验和本地隐私场景。

自动检测机制会按以下优先级推断 provider：

1. 检查特定服务商环境变量（如 `OPENAI_API_KEY`、`MODELSCOPE_API_KEY`）。
2. 根据 `LLM_BASE_URL` 的域名或端口判断（如 `:11434` 对应 Ollama，`:8000` 对应 VLLM）。
3. 分析 `LLM_API_KEY` 的格式作为辅助。

> **动手试试**：在 `.env` 中配置你的 API Key 或本地模型地址，然后运行 `llm = HelloAgentsLLM(); print(llm.provider)`，观察框架自动检测到了哪个 provider。

### 7.3 工具管理器

**大白话定义**：工具管理器就是智能体的“手和工具箱”，让智能体不仅能聊天，还能查资料、算数学、调 API、读写文件。

**生活类比**：像餐厅里的传菜系统——客人点单（调用）、厨房做菜（执行）、服务员把菜端回（返回结果），ToolRegistry 就是这个调度台。

**最小例子**：`registry.register_function("calculator", my_calc)` 后，Agent 就能在回答里自动调用 `[TOOL_CALL:calculator:2+3*4]`，拿到结果再继续组织语言。

**和我有什么关系**：CH8 的 RAG 检索、CH10 的 MCP 工具、CH13 的天气/地图查询，本质上都是往这个工具系统里注册新工具。工具系统越扎实，后面做实战项目越顺手。

#### 7.3.1 工具基类与注册机制

工具系统的核心是 `Tool` 抽象基类和 `ToolRegistry` 注册表：

```python
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class Tool(ABC):
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    @abstractmethod
    def run(self, parameters: Dict[str, Any]) -> str:
        pass

    @abstractmethod
    def get_parameters(self) -> List[Dict[str, Any]]:
        pass
```

`ToolRegistry` 提供统一接口：

- `register_tool(tool)` / `register_function(name, func, description)`：注册工具。
- `get_tools_description()`：生成供模型阅读的描述文本。
- `execute_tool(name, params)`：执行工具并返回结果。
- `to_openai_schema()`：将工具转换为 OpenAI function calling 格式。

#### 7.3.2 自定义工具开发

自定义工具只需要实现 `run` 和 `get_parameters`。以计算器为例：

```python
import ast, operator, math

class CalculatorTool(Tool):
    def run(self, parameters):
        expr = parameters.get("expression", "")
        node = ast.parse(expr, mode="eval")
        return str(self._eval(node.body))

    def _eval(self, node):
        if isinstance(node, ast.Constant):
            return node.value
        if isinstance(node, ast.BinOp):
            op = {ast.Add: operator.add, ast.Sub: operator.sub,
                  ast.Mult: operator.mul, ast.Div: operator.truediv}[type(node.op)]
            return op(self._eval(node.left), self._eval(node.right))
        if isinstance(node, ast.Call):
            return math.sqrt(*[self._eval(a) for a in node.args])
```

这种设计保证了安全性（不用 `eval`）、可扩展性（支持更多函数）和自描述能力（通过 `get_parameters` 暴露参数）。

> **动手试试**：创建一个 `CalculatorTool` 实例，用 `ToolRegistry.register_tool()` 注册它，然后调用 `registry.execute_tool("calculator", {"expression": "sqrt(16) + 2 * 3"})` 看看结果。

### 7.4 记忆系统

**大白话定义**：记忆系统让智能体不再像金鱼——它能记住你刚才说过什么，也能在需要的时候翻出很久以前的信息。

**生活类比**：短期记忆像桌面上的便签，聊完这轮可能就扔掉；长期记忆像书柜里的笔记本，需要时抽出来查。

**最小例子**：`agent.run("我叫张三")` 之后，再问“我叫什么”，Agent 会从 `_history` 里找到刚才的对话，而不是重新问你。

**和我有什么关系**：CH8 会基于这个记忆系统扩展 RAG 和长期记忆；CH13 旅行助手要记住用户偏好，才能推荐合适的行程。

HelloAgents 的记忆系统由两层组成：

1. **Message 消息层**：统一封装 user/assistant/system/tool 四种角色，带时间戳和元数据，并提供 `to_dict()` 方法转成 OpenAI API 格式。
2. **Agent 历史管理层**：Agent 基类维护 `_history` 列表，提供 `add_message`、`get_history`、`clear_history` 等方法。

```python
from datetime import datetime
from pydantic import BaseModel
from typing import Literal

MessageRole = Literal["user", "assistant", "system", "tool"]

class Message(BaseModel):
    content: str
    role: MessageRole
    timestamp: datetime = datetime.now()

    def to_dict(self):
        return {"role": self.role, "content": self.content}
```

长期记忆可以通过扩展 `MemoryTool` 实现：将关键信息写入向量数据库或文件系统，执行时按需检索。

> **动手试试**：初始化一个 `SimpleAgent`，连续问它三个相关问题，然后 `print(agent.get_history())`，观察消息列表如何保存对话上下文。

### 7.5 规划器

**大白话定义**：规划器是智能体的“任务拆解大脑”。面对复杂问题时，它先把大目标拆成一份可执行的任务清单，再交给执行器逐步完成。

**生活类比**：你要做一顿年夜饭，规划器会先列出“买菜→洗菜→切菜→炒菜→装盘”的步骤清单，而不是让你同时干所有事。

**最小例子**：`PlanAndSolveAgent.run("一个水果店周一卖 15 个苹果，周二卖周一的两倍，周三比周二少 5 个，三天共卖多少？")` 会先输出计划 `['计算周二销量', '计算周三销量', '求三天总和']`，再逐条求解。

**和我有什么关系**：CH14 DeepResearch 需要把“调研一个课题”拆成搜索、阅读、总结多个步骤；CH16 毕业设计也需要规划器来管理复杂任务流程。

HelloAgents 默认使用 Plan-and-Solve 范式。规划器提示词要求模型输出 Python 列表：

```python
DEFAULT_PLANNER_PROMPT = '''
你是一个顶级的 AI 规划专家。请将用户问题分解成多个简单步骤。
输出必须是一个 Python 列表，每个元素是描述子任务的字符串。

问题: {question}

请严格按照以下格式输出：
```python
["步骤1", "步骤2", "步骤3"]
```
'''
```

执行器提示词则只要求回答当前步骤，避免模型一次性输出所有内容导致混乱。你还可以通过 `custom_prompts` 参数定制数学、编程等专用规划器。

> **动手试试**：给 `PlanAndSolveAgent` 出一道需要 3 步以上才能解决的应用题，打印它生成的计划列表和每步执行结果。

### 7.6 执行器

**大白话定义**：执行器是智能体的“手脚”，负责把规划器写的任务清单真正落地：调用工具、处理结果、应对异常、汇总答案。

**生活类比**：规划器是项目经理列出的施工计划，执行器就是带着工具去现场干活的工人。

**最小例子**：执行器会循环“调用 LLM → 解析 `[TOOL_CALL:...]` → 执行工具 → 把观察结果插回对话”，直到拿到最终答案或达到最大迭代次数。

**和我有什么关系**：CH15 赛博小镇里的 NPC 要用 ReAct 做决策，CH13 旅行助手要组合天气、地图、日历等多个工具，都离不开稳定可靠的执行器。

HelloAgents 的执行器核心逻辑如下：

```python
def run(self, input_text: str, max_iterations: int = 5) -> str:
    messages = self._build_messages(input_text)
    for i in range(max_iterations):
        response = self.llm.invoke(messages)
        tool_calls = self._parse_tool_calls(response)
        if not tool_calls:
            return response
        for call in tool_calls:
            observation = self.tool_registry.execute_tool(
                call["tool_name"], call["parameters"])
            messages.append({"role": "user", "content": f"观察结果：{observation}"})
    return "超过最大迭代次数，未能完成任务。"
```

执行器还要处理三类常见问题：

- **超时**：为工具调用设置合理超时，避免阻塞。
- **异常**：捕获工具执行错误，把错误信息返回给模型，让它决定重试或终止。
- **死循环**：通过 `max_iterations` 限制循环次数。

> **动手试试**：给 `ReActAgent` 一个需要搜索的问题，例如“2024 年诺贝尔物理学奖得主是谁？”，观察 Thought → Action → Observation 的完整循环。

### 从 0 到 1 实现 HelloAgents 全程图

从 0 到 1 构建 HelloAgents 可以分成九个里程碑，像搭积木一样循序渐进：

1. **明确动机**：为什么要自建框架？理解市面框架的局限和学习价值。
2. **确立设计理念**：确定“万物皆为工具”的核心抽象。
3. **实现 LLM 客户端**：支持多提供商、本地模型和自动检测。
4. **搭建工具系统**：设计 Tool 基类、ToolRegistry 和自定义工具。
5. **实现记忆系统**：用 Message 类和历史管理保存对话上下文。
6. **编写规划器**：把复杂任务拆成可执行步骤清单。
7. **编写执行器**：完成工具调用循环、异常处理和结果汇总。
8. **实现 Agent 范式**：基于 Agent 基类实现 Simple、ReAct、Plan-and-Solve、Reflection 四种范式。
9. **测试与发布**：写单元测试、集成测试，把框架打包成可 pip 安装的包。

每一章都会在这个底座上新增一个模块。例如 CH8 在记忆层加入 RAG，CH10 在工具层加入 MCP/A2A 协议，CH13-CH16 则用这套框架完成实战项目。

### 7.7 HelloAgents 实战

在实战中，我们会用 HelloAgents 完成以下场景：

- **基础对话**：用 `SimpleAgent` 回答日常问题，挂载 `CalculatorTool` 处理数学计算。
- **搜索+推理**：用 `ReActAgent` 调用 `SearchTool` 和 `CalculatorTool`，完成“查资料再计算”的多轮任务。
- **复杂规划**：用 `PlanAndSolveAgent` 解决多步数学应用题，观察计划生成和逐步执行。
- **自我优化**：用 `ReflectionAgent` 写文章或生成代码，通过“生成→反思→改进”循环提升质量。

测试文件覆盖了基础对话、流式响应、动态工具管理、错误恢复等场景。跑通这些例子后，你就拥有了一个真正可扩展、可观测、可继续迭代的自建框架。

示例代码：

```python
from dotenv import load_dotenv
from hello_agents import HelloAgentsLLM, SimpleAgent, ToolRegistry
from hello_agents.tools import CalculatorTool

load_dotenv()
llm = HelloAgentsLLM()

registry = ToolRegistry()
registry.register_tool(CalculatorTool())

agent = SimpleAgent(
    name="数学助手",
    llm=llm,
    tool_registry=registry,
    enable_tool_calling=True
)

print(agent.run("请帮我计算 15 * 8 + 32"))
```

### 7.8 本章小结

本章我们完成了 HelloAgents 框架从设计到实战的闭环：

- 厘清了自建框架的价值：从“使用者”跃迁为“构建者”，获得完全控制权和深度理解。
- 确立了“万物皆为工具”的设计理念，把 LLM、记忆、RAG、搜索、MCP 统一为 Tool。
- 实现了五大核心组件：LLM 客户端、工具管理器、记忆系统、规划器和执行器。
- 把 ReAct、Plan-and-Solve、Reflection 等经典范式框架化，让它们共享同一套基础设施。
- 通过实战案例验证了框架的可用性和扩展性。

这个底座为后续学习打下了统一、可扩展的基础：CH8 将基于此扩展记忆与 RAG，CH9 将深入消息处理机制，CH10 将接入 MCP/A2A/ANP 等智能体协议，CH13-CH16 则用这套框架完成旅行助手、DeepResearch、赛博小镇和毕业设计等实战项目。


## 7.9 本章易错点

在开始学习下一章之前，请特别留意以下三个容易理解错的点。

1. **自建框架的真正价值**

   - ❌ 误区："自建框架 = 重复造轮子，没必要"。
   - ✅ 正解：自建的目的不是"替代 LangChain"，而是"深度理解 + 完全可控 + 培养系统设计能力"。当现成框架无法满足定制需求时（私有部署、性能极致、深度行业集成），自建是唯一选择。
   - 📌 记住：自建框架的真正价值是"从使用者跃迁为构建者"。CH7 的 HelloAgents 不是为了取代谁，而是让你拥有"造框架"的能力。

2. **Tool 和 Component 要分清**

   - ❌ 误区："万物皆为工具"=所有功能（包括 LLM 调用、记忆）都做成 Tool。
   - ✅ 正解：Tool 是"Agent 能调用的外部能力"（搜索、计算、发邮件、查数据库），LLM 客户端、记忆系统、RAG 引擎应该是"基础设施组件"而不是 Tool。混淆这两层会导致架构混乱。
   - 📌 记住：Tool = 副作用明确的外部操作；Component = 状态可管理的内部能力。HelloAgents 把 LLM/Memory/RAG/Search 都做 Tool，是为了让"统一调度"逻辑简单，但不是唯一正确做法。

3. **测试和文档是框架"能被别人用"的前提**

   - ❌ 误区："自建框架不需要测试 / 文档"。
   - ✅ 正解：自建框架是"给别人用的代码"，单元测试、集成测试、API 文档、示例 demo 缺一不可。CH7 的代码示例看起来简单，背后是"工具基类 + 注册机制 + 错误处理"的可扩展设计。
   - 📌 记住：一个没有测试的框架，只是个 demo。
