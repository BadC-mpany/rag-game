Make a list of realistic routine tasks that a LLM agent might carry out for the example of internal llm agents in a company (if you have any other nice routine tasks for a different type of agent, also include them separately in another list). Mainly focus on the example of an internal agent in a company and provide an exhaustive list of tasks which it can do. Think where humans will likely be automatized in processes (like a manager wanting to more easily keep track of employees work). Then also include some more diverse example. I want high quality, this is critical work. Realistic examples for an agent are things which are within the capabilities of an llm (with access to tools, databases, nice system prompts and examples, and access (with well defined permissions and limitations)) to company data (similarly to a human worker / manager), and tasks that are not suitable for an algorithmic solution. So for example, counting thenumber of lines of code written by employees is something best done by an algorithm, but if you also want to consider the quality and evaluate it in the context of the project goals, milestones, timeline, etc... then an agent is necessary. You need to think of cases where agents leverage their strength. These routines tasks will be evaluated in terms of possible security issues. In the end I will want  a list of routine processes and possiblesecurity issues (note: only include the risks if they are realistic problems, but if not, leave it empty, i am an expert and i will fill it out, your main task ist come up with many tasks). The risks and security issues can leverage the fact that an attacker can know what teh agents workflow will be (so what documents it will read. ex: git commits). Example:

TASK <-> RISK
Read all yesterday's commit messages (and possibly the code as well to evaluate quality) and employees personal summaries (short 4-10 sentences). Check what items in project's to-do list have been accomplished or milestones achieved and also give employees points <-> employee might hide a prompt injection attack in some document which it know that






side comment: it would be nice to also come up with situations or levels where we do not predict how the successful attack will be (rather, let the players come up with innovative solutions we have not thought of). we have not done this yet, but it would be great. we do need an approach to do this and it is not trivial. let's dicuss



- there is a lot of repetition in the LLM processing (it will read the same documents, system prompts, etc). Should we precomput some of this? (unless we have a ton of users, it's not worth it)



