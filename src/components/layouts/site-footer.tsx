import { Section, Flex } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-auto bg-background">
      <Section className="py-12">
        <Flex justify="between">
          <Text variant="small">© 2025 Behave Inc.</Text>
          <Flex gap="md">
            <Text variant="small" className="hover:underline cursor-pointer">Twitter</Text>
            <Text variant="small" className="hover:underline cursor-pointer">GitHub</Text>
          </Flex>
        </Flex>
      </Section>
    </footer>
  );
}

