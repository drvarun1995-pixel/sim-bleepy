import { useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";
import { toast } from "sonner";

export default function StartCall({ configId, accessToken }: { configId?: string, accessToken: string }) {
  const { status, connect } = useVoice();

  return (
    <AnimatePresence>
      {status.value !== "connected" ? (
        <motion.div
          className={"fixed inset-0 p-4 flex items-center justify-center bg-background"}
          initial="initial"
          animate="enter"
          exit="exit"
          variants={{
            initial: { opacity: 0 },
            enter: { opacity: 1 },
            exit: { opacity: 0 },
          }}
        >
          <AnimatePresence>
            <motion.div
              variants={{
                initial: { scale: 0.5 },
                enter: { scale: 1 },
                exit: { scale: 0.5 },
              }}
            >
              <Button
                className={"z-50 flex items-center gap-1.5 rounded-full"}
                onClick={() => {
                  connect({ 
                    auth: { type: "accessToken", value: accessToken },
                    configId
                    // Note: To prevent Hume from storing chat history, enable "Zero Data Retention" 
                    // in your Hume dashboard at https://platform.hume.ai/settings
                    // All chat history is stored locally in our database only
                  } as any)
                    .then(() => {})
                    .catch(() => {
                      toast.error("Unable to start call", { duration: 3000 });
                    })
                    .finally(() => {});
                }}
              >
                <span>
                  <Phone
                    className={"size-4 opacity-50 fill-current"}
                    strokeWidth={0}
                  />
                </span>
                <span>Start Call</span>
              </Button>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
