/** The instruction line every exercise type shows above its content. */
export default function PromptHeading({ children }: { children: string }) {
  return <h1 className="mb-6 text-2xl sm:text-3xl">{children}</h1>;
}
