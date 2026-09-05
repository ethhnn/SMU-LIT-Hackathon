# Legal Technology Training

Language for teaching lawyers to operate technologies in a practical training workflow.

## Language

**Learner**:
A lawyer who is unfamiliar with, or lacks confidence using, a technology workflow.
_Avoid_: Client, trainee client

**Training objective**:
The software task the learner wants to learn how to complete, expressed using a generic or synthetic use case.
_Avoid_: Legal conclusion, matter instructions

**Training scenario**:
A generic or synthetic use case described by the Learner or selected from an optional example, giving a Training objective its practical context.
_Avoid_: Mandatory lesson, client matter, live matter

**Tool recommendation**:
A scenario-specific suggestion of a catalog technology, with its role, advantages, limitations, and tutorial coverage. The learner may select a recommendation as input to a Shared Help Clip.
_Avoid_: Verified Workflow, live integration

**Tutorial coverage**:
The operations for which reviewed instructions and required training assets are available for a tool.
_Avoid_: Recommendation eligibility, coverage of every product feature

**Scenario chat**:
A conversation about a training scenario and the learner's questions while following its workflow.
_Avoid_: Matter file

**Training workflow**:
An ordered set of software operations the learner follows to accomplish a training objective; a cross-tool workflow involves more than one technology.
_Avoid_: Legal analysis, completed work

**Synthetic demo asset**:
A fabricated document or other training material that does not represent a real client or matter.
_Avoid_: Client document, anonymized client document

**Verified asset**:
A reviewed visual training material associated with a Verified Action and a specific interface state. Its presence alone does not establish that an action or workflow has been tested.
_Avoid_: Verified workflow, proof of execution

**Verified Action**:
A manually tested software operation with a known starting condition, reviewed instruction, and expected result.
_Avoid_: Screenshot, guessed instruction

**Verified Workflow**:
A complete sequence of Verified Actions tested end-to-end, including any handoffs when multiple tools are involved.
_Avoid_: Arbitrary generated sequence

**Help Focus**:
The step or question the Learner is currently asking about within a Scenario chat.
_Avoid_: Actual screen, completed step

**Lesson Plan**:
A manually curated record for one exact selected set of tools, with an ordered sequence of reviewed scenes and actions. It is required before the tutor can render a Shared Help Clip.
_Avoid_: AI-generated workflow, inferred handoff

**Shared Help Clip**:
One requested tutorial clip that renders every scene in a matching Lesson Plan for the learner's selected tools. It may explain each tool's curated role, but does not claim an operational handoff unless that handoff is reviewed in the Lesson Plan.
_Avoid_: Separate clip per selected tool, fabricated combined tutorial

**Support Topic**:
A legacy curated unit used by the manually reviewed OpenLaw starter action. New contextual screenshot selection uses the Screenshot Index instead of a fixed topic list.
_Avoid_: General screenshot catalog, hardcoded question answer

**Screenshot Index**:
A generated JSON inventory of every supplied screenshot, including its tool, filename-derived keywords, dimensions, full image path, and thumbnail path. OpenRouter searches this index before visually inspecting candidates.
_Avoid_: Question-specific lookup table, proof that an interaction was tested

**Dynamic Screenshot Scene Sequence**:
An ordered set of up to three screenshot-observation scenes produced after OpenRouter selects and visually inspects indexed images. Each scene contains its exact asset ID, image-grounded instruction, caption, and highlight. The sequence is carried only in a signed generation token. A broad objective may use an access scene followed by destination content, while a narrow question should remain a single scene.
_Avoid_: Verified Action, model-invented asset path

**Screenshot Guide**:
A visible interface screenshot with a grounded highlight, instruction or observation, expected result, and evidence-status label. Screenshot guidance can exist without video eligibility.
_Avoid_: Verified Action unless manually tested

**Contextual Teaching Turn**:
One learner question and its appended OpenRouter-generated tutor answer, Screenshot Guides, coverage status, and optional explicitly generated Help Clip. It can use checked tools or, when none are checked, the current recommendations as context. Earlier turns remain visible while only a bounded recent history is sent as model context.
_Avoid_: Replacement of the initial lesson, automatic video generation

**Mock tool**:
A clearly identified demonstration of a fictional firm's internal technology.
_Avoid_: Live integration, supported commercial product

**Tutorial clip**:
A short educational audio-video demonstration of user-system interactions for a training use case.
_Avoid_: Evidence of learner completion

**Help Clip**:
A tutorial clip focused on a reviewed action or supported portion of a workflow relevant to the learner's difficulty. A Shared Help Clip is the selected-set form of this clip.
_Avoid_: Full-workflow video, recording of the learner's work

## Research product names

**LawNet**:
The Singapore Academy of Law's broader legal research platform.
_Avoid_: OpenLaw as a synonym for the entire platform

**OpenLaw**:
The public judgment resource provided through LawNet, described by the Singapore Academy of Law as Open Law.
_Avoid_: Paid LawNet research interface
