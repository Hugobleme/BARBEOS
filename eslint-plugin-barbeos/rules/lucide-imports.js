import * as Lucide from "lucide-react";

const allIcons = new Set(Object.keys(Lucide));

export const lucideImportsRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure lucide-react icons used in JSX are imported",
    },
    fixable: "code",
    schema: [],
    messages: {
      missingImport: "Icon '{{name}}' is used but not imported from 'lucide-react'.",
    },
  },
  create(context) {
    let importedIcons = new Set();

    return {
      ImportDeclaration(node) {
        if (node.source && node.source.value === "lucide-react") {
          node.specifiers.forEach((spec) => {
            if (spec.type === "ImportSpecifier") {
              importedIcons.add(spec.local.name);
            }
          });
        }
      },
      JSXOpeningElement(node) {
        if (node.name.type === "JSXIdentifier") {
          const name = node.name.name;
          
          if (allIcons.has(name)) {
            if (!importedIcons.has(name)) {
              // Check if variable is defined in scope
              const sourceCode = context.sourceCode || context.getSourceCode();
              let scope = sourceCode.getScope ? sourceCode.getScope(node) : context.getScope();
              
              let isDefined = false;
              while (scope) {
                if (scope.set.has(name)) {
                  isDefined = true;
                  break;
                }
                scope = scope.upper;
              }
              
              if (!isDefined) {
                context.report({
                  node: node.name,
                  messageId: "missingImport",
                  data: { name },
                });
              }
            }
          }
        }
      }
    };
  }
};
