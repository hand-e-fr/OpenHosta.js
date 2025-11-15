import nunjucks, { Environment } from "nunjucks";

export interface MetaPromptInitOptions {
  /** Custom nunjucks Environment to use for template compilation. */
  env?: Environment;
}

export type MetaPromptRenderContext = Record<string, unknown>;

const defaultEnvironment = new nunjucks.Environment(undefined, {
  autoescape: false,
  throwOnUndefined: false,
  trimBlocks: false,
  lstripBlocks: false
});

function normalizeNewLines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

function dedent(text: string): string {
  const normalized = normalizeNewLines(text);
  const lines = normalized.split("\n");

  let minIndent: number | null = null;
  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    if (minIndent === null || indent < minIndent) {
      minIndent = indent;
    }
  }

  const indent = minIndent ?? 0;
  if (indent === 0) {
    return normalized;
  }

  return lines
    .map((line) => (line.trim().length === 0 ? "" : line.slice(indent)))
    .join("\n");
}

function collapseEmptyLines(text: string): string {
  const lines = normalizeNewLines(text).split("\n");
  if (lines.length === 0) {
    return "";
  }

  const cleaned: string[] = [lines[0]];
  for (const line of lines.slice(1)) {
    const isCurrentEmpty = line.trim().length === 0;
    const isPrevEmpty = cleaned[cleaned.length - 1]?.trim().length === 0;

    if (isCurrentEmpty && isPrevEmpty) {
      continue;
    }
    cleaned.push(line);
  }
  return cleaned.join("\n");
}

export class MetaPrompt {
  private sourceText: string;
  private environment: Environment;
  private template: nunjucks.Template;

  constructor(source: string, options: MetaPromptInitOptions = {}) {
    this.environment = options.env ?? defaultEnvironment;
    this.sourceText = dedent(source);
    this.template = nunjucks.compile(this.sourceText, this.environment);
  }

  copy(options: MetaPromptInitOptions = {}): MetaPrompt {
    return new MetaPrompt(this.sourceText, {
      env: options.env ?? this.environment
    });
  }

  get source(): string {
    return this.sourceText;
  }

  set source(value: string) {
    this.sourceText = dedent(value);
    this.template = nunjucks.compile(this.sourceText, this.environment);
  }

  render(context: MetaPromptRenderContext = {}): string {
    const rendered = this.template.render(context);
    return collapseEmptyLines(rendered);
  }

  toString(): string {
    return this.source;
  }

  [Symbol.for("nodejs.util.inspect.custom")](): string {
    return [
      `${this.constructor.name} (${this.environment?.constructor.name})`,
      "MetaPrompt source:",
      "--------------------------------",
      this.source
    ].join("\n");
  }
}

export const EMULATE_META_PROMPT = new MetaPrompt(
  String.raw`\
    You will act as a simulator for functions that cannot be implemented in actual code.

    I'll provide you with function definitions described in Python syntax. 
    These functions will have no body and may even be impossible to implement in real code, 
    so do not attempt to generate the implementation.

    Instead, imagine a realistic or reasonable output that matches the function description.
    I'll ask questions by directly writing out function calls as one would call them in Python.
    Respond with an appropriate return value{% if use_json_mode %} formatted as valid JSON{% endif %}, without adding any extra comments or explanations.
    If the provided information isn't enough to determine a clear answer, respond simply with "None".
    If assumptions need to be made, ensure they stay realistic, align with the provided description.

    {% if allow_thinking %}If unable to determine a clear answer or if assumptions need to be made, 
    explain is in between <think></think> tags.{% endif %}

    Here's the function definition:

    \`\`\`python
    {{ function_return_as_python_type }}
    
    def {{ function_name }}({{ function_args }}) -> {{ function_return_type_name }}:
        """{{ function_doc }}"""
        
        ...
        ...behavior to be simulated...
        ...
        
        return ...appropriate return value...
    \`\`\`
                        
    
    {% if use_json_mode %} As you return the result in JSON format, here's the schema of the JSON object you should return:
    {{ function_return_as_json_schema }} {% endif %}
                        
    {% if examples_database %}Here are some examples of expected input and output:
    {{ examples_database }}{% endif %}

    {% if chain_of_thought %}To solve the request, you have to follow theses intermediate steps. Give only the final result, don't give the result of theses intermediate steps:
    {{ chain_of_thought }}{% endif %}

    {% if allow_thinking %}
    If you need to think first, place your thought within <think></think> before answering like this:
    <think>
    The user might want ...
    Wait, I have to...
    </think>{% endif %}`
);

export const USER_CALL_META_PROMPT = new MetaPrompt(
  String.raw`\
    {% if variables_initialization %}# Values of parameters to be used
    {{ variables_initialization }}{% endif %}
    {{ function_name }}({{ function_call_arguments }})`
);
