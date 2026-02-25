import { AppState } from "react-native";
import savedItemsStore from "@/src/state/savedItems";

type PendingClick = {
  itemId: string;
  provider: string;
  url: string;
  ts: number;
};

let pendingClick: PendingClick | null = null;
let modalHandler: ((itemId: string) => void) | null = null;

export function registerPartnerClick(args: {
  itemId: string;
  provider: string;
  url: string;
}) {
  pendingClick = {
    itemId: String(args.itemId),
    provider: String(args.provider),
    url: String(args.url),
    ts: Date.now(),
  };
}

export function registerReturnModalHandler(fn: (itemId: string) => void) {
  modalHandler = fn;
}

export function bootstrapPartnerReturnPrompt() {
  let lastState = AppState.currentState;

  AppState.addEventListener("change", (next) => {
    const wasBackground =
      lastState === "inactive" || lastState === "background";

    if (wasBackground && next === "active") {
      if (pendingClick && modalHandler) {
        const click = pendingClick;
        pendingClick = null;
        modalHandler(click.itemId);
      }
    }

    lastState = next;
  });
}

export async function markTicketBooked(itemId: string) {
  try {
    await savedItemsStore.transitionStatus(itemId, "booked");
  } catch {}
}
