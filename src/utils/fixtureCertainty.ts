Step 3 — Use in Match screen
Inside app/match/[id].tsx
Add:
TypeScript
Copy code
import FixtureCertaintyBadge from "@/src/components/FixtureCertaintyBadge";
import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";
Then where kickoff is shown:
TypeScript
Copy code
const certainty = getFixtureCertainty(fixture, {
  placeholderIds,
  previousKickoffIso: followSnapshot?.kickoffIso ?? null,
});
Render under kickoff line:
TypeScript
Copy code
<FixtureCertaintyBadge state={certainty} />
✅ Step 4 — Trip screen integration
In your Trip [id].tsx matches list:
You already compute kickoff meta.
Add certainty:
TypeScript
Copy code
const certainty = getFixtureCertainty(r, {
  previousKickoffIso: (trip as any)?.kickoffIso ?? null,
});
Render next to kickoff:
TypeScript
Copy code
<FixtureCertaintyBadge state={certainty} />
✅ Step 5 — Alert trigger (date change)
You already refresh followed matches.
Just add this rule:
If:
Copy code

oldIso !== newIso
AND !isKickoffTbc(new)
→ fire alert:
Copy code

"Kickoff changed — check your trip"
You likely already have this scaffold in refreshFollowedMatches.
