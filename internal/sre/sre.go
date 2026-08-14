package sre

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"

	"ndxCraft/internal/fcmsdoc"
)

// Project is an opened folder, optionally a Sentinel SRE.
type Project struct {
	Root  string `json:"root"`
	Name  string `json:"name"`
	IsSRE bool   `json:"isSre"`
	Kits  []Kit  `json:"kits"`
}

// Kit is a Sentinel kit with fcms content.
type Kit struct {
	Dir         string    `json:"dir"`
	Path        string    `json:"path"`
	NS          string    `json:"ns"`
	Name        string    `json:"name"`
	DisplayName string    `json:"displayName"`
	Articles    []Article `json:"articles"`
	Templates   []string  `json:"templates"`
}

// Article is a Markdown file under ct/.
type Article struct {
	Slug    string `json:"slug"`
	Path    string `json:"path"`
	Title   string `json:"title"`
	RelPath string `json:"relPath"`
}

// SearchHit is a content search match.
type SearchHit struct {
	Path    string `json:"path"`
	Slug    string `json:"slug"`
	Kit     string `json:"kit"`
	Title   string `json:"title"`
	Line    int    `json:"line"`
	Excerpt string `json:"excerpt"`
}

// Inspect returns SRE metadata for root, or a non-SRE project with empty kits.
func Inspect(root string) (*Project, error) {
	abs, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}
	p := &Project{
		Root: abs,
		Name: filepath.Base(abs),
		Kits: []Kit{},
	}
	if _, err := os.Stat(filepath.Join(abs, "sentinel.yaml")); err != nil {
		return p, nil
	}
	p.IsSRE = true
	if name := projectName(filepath.Join(abs, "sentinel.yaml")); name != "" {
		p.Name = name
	}

	entries, err := os.ReadDir(abs)
	if err != nil {
		return p, err
	}
	for _, e := range entries {
		if !e.IsDir() || strings.HasPrefix(e.Name(), ".") {
			continue
		}
		kitPath := filepath.Join(abs, e.Name())
		if _, err := os.Stat(filepath.Join(kitPath, "kit.yaml")); err != nil {
			continue
		}
		kit := inspectKit(e.Name(), kitPath)
		p.Kits = append(p.Kits, kit)
	}
	return p, nil
}

func inspectKit(dir, kitPath string) Kit {
	ns, name := splitKitDir(dir)
	k := Kit{
		Dir:         dir,
		Path:        kitPath,
		NS:          ns,
		Name:        name,
		DisplayName: dir,
		Articles:    []Article{},
		Templates:   []string{},
	}
	if dn := kitDisplayName(filepath.Join(kitPath, "kit.yaml")); dn != "" {
		k.DisplayName = dn
	}

	ct := filepath.Join(kitPath, "ct")
	_ = filepath.WalkDir(ct, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		if !isContentMarkdown(d.Name()) {
			return nil
		}
		rel, _ := filepath.Rel(ct, path)
		rel = filepath.ToSlash(rel)
		slug := strings.TrimSuffix(rel, filepath.Ext(rel))
		title := ""
		if raw, err := os.ReadFile(path); err == nil {
			doc := fcmsdoc.Split(string(raw))
			if t, ok := doc.FrontMatter["title"].(string); ok {
				title = t
			}
		}
		k.Articles = append(k.Articles, Article{
			Slug:    slug,
			Path:    path,
			Title:   title,
			RelPath: rel,
		})
		return nil
	})

	tp := filepath.Join(kitPath, "tp")
	if entries, err := os.ReadDir(tp); err == nil {
		for _, e := range entries {
			if e.IsDir() {
				continue
			}
			n := e.Name()
			ext := strings.ToLower(filepath.Ext(n))
			if ext == ".gohtml" || ext == ".html" {
				k.Templates = append(k.Templates, strings.TrimSuffix(n, ext))
			}
		}
	}
	return k
}

func isContentMarkdown(name string) bool {
	lower := strings.ToLower(name)
	if strings.HasPrefix(name, ".") {
		return false
	}
	if strings.HasSuffix(lower, ".lua.md") || strings.HasSuffix(lower, ".yaml.md") || strings.HasSuffix(lower, ".yml.md") || strings.HasSuffix(lower, ".md.md") {
		return false
	}
	ext := filepath.Ext(lower)
	return ext == ".md" || ext == ".markdown"
}

func splitKitDir(dir string) (ns, name string) {
	i := strings.Index(dir, ".")
	if i <= 0 || i == len(dir)-1 {
		return "", dir
	}
	return dir[:i], dir[i+1:]
}

func projectName(path string) string {
	f, err := os.Open(path)
	if err != nil {
		return ""
	}
	defer f.Close()
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if strings.HasPrefix(line, "name:") {
			return strings.Trim(strings.TrimSpace(strings.TrimPrefix(line, "name:")), `"'`)
		}
	}
	return ""
}

func kitDisplayName(path string) string {
	return projectName(path)
}

// LocateFile returns kit/slug metadata for a path inside an inspected project.
func LocateFile(p *Project, filePath string) (kit *Kit, article *Article) {
	if p == nil {
		return nil, nil
	}
	abs, err := filepath.Abs(filePath)
	if err != nil {
		abs = filePath
	}
	for i := range p.Kits {
		k := &p.Kits[i]
		for j := range k.Articles {
			a := &k.Articles[j]
			if filepath.Clean(a.Path) == filepath.Clean(abs) {
				return k, a
			}
		}
		ct := filepath.Join(k.Path, "ct")
		if strings.HasPrefix(abs, ct+string(os.PathSeparator)) || abs == ct {
			rel, _ := filepath.Rel(ct, abs)
			rel = filepath.ToSlash(rel)
			slug := strings.TrimSuffix(rel, filepath.Ext(rel))
			art := Article{Slug: slug, Path: abs, RelPath: rel}
			return k, &art
		}
	}
	return nil, nil
}

// Search walks fcms content (or all markdown if not an SRE) for query.
func Search(root, query string) ([]SearchHit, error) {
	query = strings.ToLower(strings.TrimSpace(query))
	if query == "" {
		return []SearchHit{}, nil
	}
	proj, err := Inspect(root)
	if err != nil {
		return nil, err
	}
	var hits []SearchHit
	if proj.IsSRE {
		for _, kit := range proj.Kits {
			for _, art := range kit.Articles {
				hits = append(hits, searchFile(art.Path, art.Slug, kit.Dir, art.Title, query)...)
			}
		}
		return hits, nil
	}
	_ = filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			if d != nil && (d.Name() == ".git" || d.Name() == "node_modules" || d.Name() == ".sentinel") {
				return filepath.SkipDir
			}
			return nil
		}
		if !isContentMarkdown(d.Name()) {
			return nil
		}
		hits = append(hits, searchFile(path, filepath.Base(path), "", "", query)...)
		return nil
	})
	return hits, nil
}

func searchFile(path, slug, kit, title, query string) []SearchHit {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil
	}
	var hits []SearchHit
	lines := strings.Split(string(raw), "\n")
	for i, line := range lines {
		if strings.Contains(strings.ToLower(line), query) {
			excerpt := strings.TrimSpace(line)
			if len(excerpt) > 160 {
				excerpt = excerpt[:160] + "…"
			}
			hits = append(hits, SearchHit{
				Path:    path,
				Slug:    slug,
				Kit:     kit,
				Title:   title,
				Line:    i + 1,
				Excerpt: excerpt,
			})
			if len(hits) >= 40 {
				break
			}
		}
	}
	return hits
}

// CreateArticle writes a new ct/{slug}.md with ordered frontmatter.
func CreateArticle(kitPath, slug, title, description string, tags []string) (string, error) {
	if err := fcmsdoc.ValidateSlug(slug); err != nil {
		return "", err
	}
	rel := filepath.FromSlash(slug) + ".md"
	path := filepath.Join(kitPath, "ct", rel)
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return "", err
	}
	fm := map[string]interface{}{
		"title": title,
		"slug":  slug,
	}
	if description != "" {
		fm["description"] = description
	}
	if len(tags) > 0 {
		fm["tags"] = tags
	}
	body := ""
	if title != "" {
		body = "# " + title + "\n\n"
	}
	raw, err := fcmsdoc.Assemble(fm, body, true)
	if err != nil {
		return "", err
	}
	if err := os.WriteFile(path, []byte(raw), 0644); err != nil {
		return "", err
	}
	return path, nil
}
