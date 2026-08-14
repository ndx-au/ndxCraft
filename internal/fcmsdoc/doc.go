package fcmsdoc

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9\-]*(\/[a-z0-9][a-z0-9\-]*)*$`)

var knownOrder = []string{"title", "slug", "date", "description", "tags", "agent_context"}

// Warning is a non-fatal frontmatter issue.
type Warning struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// Document is the split representation of an fcms Markdown file.
type Document struct {
	HasFrontMatter bool                   `json:"hasFrontMatter"`
	FrontMatter    map[string]interface{} `json:"frontMatter"`
	Body           string                 `json:"body"`
	Warnings       []Warning              `json:"warnings"`
}

// ValidateSlug checks Sentinel fcms slug rules.
func ValidateSlug(slug string) error {
	if slug == "" {
		return fmt.Errorf("slug must not be empty")
	}
	if strings.Contains(slug, "..") {
		return fmt.Errorf("slug must not contain '..'")
	}
	if strings.HasPrefix(slug, "/") || strings.HasPrefix(slug, "_") {
		return fmt.Errorf("slug must not start with '/' or '_'")
	}
	if !slugPattern.MatchString(slug) {
		return fmt.Errorf("slug must be lowercase alphanumeric with hyphens and forward slashes")
	}
	return nil
}

// Split splits a raw markdown file into frontmatter and body.
func Split(content string) Document {
	doc := Document{
		FrontMatter: map[string]interface{}{},
		Body:        content,
	}

	if !strings.HasPrefix(content, "---\n") && !strings.HasPrefix(content, "---\r\n") {
		doc.Warnings = ValidateFrontMatter(doc.FrontMatter)
		return doc
	}

	rest := content[4:]
	closingIdx := strings.Index(rest, "\n---\n")
	if closingIdx == -1 {
		closingIdx = strings.Index(rest, "\r\n---\r\n")
		if closingIdx == -1 {
			if strings.HasSuffix(rest, "\n---\n") || strings.HasSuffix(strings.TrimRight(rest, "\r\n"), "\n---") {
				closingIdx = strings.LastIndex(rest, "\n---")
			}
			if closingIdx == -1 {
				doc.Warnings = ValidateFrontMatter(doc.FrontMatter)
				return doc
			}
		}
	}

	yamlContent := rest[:closingIdx]
	bodyStart := closingIdx + len("\n---\n")
	if bodyStart > len(rest) {
		bodyStart = len(rest)
	}
	body := rest[bodyStart:]
	body = strings.TrimPrefix(body, "\n")
	body = strings.TrimPrefix(body, "\r\n")

	var fmMap map[string]interface{}
	if err := yaml.Unmarshal([]byte(yamlContent), &fmMap); err != nil {
		doc.Body = content
		doc.Warnings = []Warning{{Field: "frontmatter", Message: "YAML frontmatter is not parseable"}}
		return doc
	}
	if fmMap == nil {
		fmMap = map[string]interface{}{}
	}

	doc.HasFrontMatter = true
	doc.FrontMatter = fmMap
	doc.Body = body
	doc.Warnings = ValidateFrontMatter(fmMap)
	return doc
}

// Assemble combines frontmatter and body into a file.
// If frontmatter is empty and hadFrontMatter is false, the body is returned as-is.
func Assemble(frontmatter map[string]interface{}, body string, hadFrontMatter bool) (string, error) {
	if frontmatter == nil {
		frontmatter = map[string]interface{}{}
	}
	if !hadFrontMatter && isEmptyFrontMatter(frontmatter) {
		if body != "" && !strings.HasSuffix(body, "\n") {
			return body + "\n", nil
		}
		return body, nil
	}

	yamlBytes, err := marshalOrdered(frontmatter)
	if err != nil {
		return "", err
	}

	var b strings.Builder
	b.WriteString("---\n")
	b.Write(yamlBytes)
	if len(yamlBytes) > 0 && !strings.HasSuffix(string(yamlBytes), "\n") {
		b.WriteString("\n")
	}
	b.WriteString("---\n")
	if body != "" {
		b.WriteString("\n")
		b.WriteString(body)
		if !strings.HasSuffix(body, "\n") {
			b.WriteString("\n")
		}
	}
	return b.String(), nil
}

// ValidateFrontMatter returns advisory warnings (never blocks save).
func ValidateFrontMatter(fm map[string]interface{}) []Warning {
	var warnings []Warning
	title := strings.TrimSpace(asString(fm["title"]))
	if title == "" {
		warnings = append(warnings, Warning{Field: "title", Message: "title is recommended but not required"})
	}
	if date := asString(fm["date"]); date != "" && !isValidDate(date) {
		warnings = append(warnings, Warning{Field: "date", Message: "date is not parseable as RFC3339 or YYYY-MM-DD"})
	}
	if slug := asString(fm["slug"]); slug != "" {
		if err := ValidateSlug(slug); err != nil {
			warnings = append(warnings, Warning{Field: "slug", Message: err.Error()})
		}
	}
	return warnings
}

func isValidDate(s string) bool {
	for _, f := range []string{time.RFC3339, "2006-01-02"} {
		if _, err := time.Parse(f, s); err == nil {
			return true
		}
	}
	return false
}

func isEmptyFrontMatter(fm map[string]interface{}) bool {
	for _, v := range fm {
		if !isEmpty(v) {
			return false
		}
	}
	return true
}

func isEmpty(v interface{}) bool {
	if v == nil {
		return true
	}
	switch t := v.(type) {
	case string:
		return strings.TrimSpace(t) == ""
	case []interface{}:
		return len(t) == 0
	case []string:
		return len(t) == 0
	case map[string]interface{}:
		return len(t) == 0
	default:
		return false
	}
}

func asString(v interface{}) string {
	if v == nil {
		return ""
	}
	s, ok := v.(string)
	if !ok {
		return strings.TrimSpace(fmt.Sprint(v))
	}
	return s
}

func marshalOrdered(fm map[string]interface{}) ([]byte, error) {
	node := &yaml.Node{Kind: yaml.MappingNode}
	seen := map[string]bool{}
	for _, k := range knownOrder {
		v, ok := fm[k]
		if !ok || isEmpty(v) {
			continue
		}
		seen[k] = true
		if err := appendKV(node, k, v); err != nil {
			return nil, err
		}
	}
	var extras []string
	for k := range fm {
		if seen[k] || isEmpty(fm[k]) {
			continue
		}
		extras = append(extras, k)
	}
	sort.Strings(extras)
	for _, k := range extras {
		if err := appendKV(node, k, fm[k]); err != nil {
			return nil, err
		}
	}
	return yaml.Marshal(node)
}

func appendKV(node *yaml.Node, key string, value interface{}) error {
	var valNode yaml.Node
	if err := valNode.Encode(value); err != nil {
		return fmt.Errorf("encode %s: %w", key, err)
	}
	node.Content = append(node.Content,
		&yaml.Node{Kind: yaml.ScalarNode, Tag: "!!str", Value: key},
		&valNode,
	)
	return nil
}
