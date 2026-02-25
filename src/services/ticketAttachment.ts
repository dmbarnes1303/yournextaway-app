import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import savedItemsStore from "@/src/state/savedItems";

export async function attachTicketProof(itemId: string) {
  try {
    // ask user: image or file
    const img = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!img.canceled && img.assets?.length) {
      const a = img.assets[0];

      await savedItemsStore.addAttachment(itemId, {
        id: String(Date.now()),
        uri: a.uri,
        kind: "image",
        name: "ticket.jpg",
        createdAt: Date.now(),
      });

      return true;
    }

    const doc = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (doc.type === "success") {
      await savedItemsStore.addAttachment(itemId, {
        id: String(Date.now()),
        uri: doc.uri,
        kind: "file",
        name: doc.name,
        createdAt: Date.now(),
      });

      return true;
    }

    return false;
  } catch {
    return false;
  }
}
