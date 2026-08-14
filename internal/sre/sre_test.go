package sre

import (
	"os"
	"path/filepath"
	"testing"
)

func TestInspectGenericFolder(t *testing.T) {
	dir := t.TempDir()
	p, err := Inspect(dir)
	if err != nil {
		t.Fatal(err)
	}
	if p.IsSRE {
		t.Fatal("empty dir is not an SRE")
	}
}

func TestInspectSREAndCreateArticle(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "sentinel.yaml"), []byte("name: Test SRE\n"), 0644); err != nil {
		t.Fatal(err)
	}
	kit := filepath.Join(root, "acme.docs")
	if err := os.MkdirAll(filepath.Join(kit, "ct", "guides"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(kit, "tp"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(kit, "kit.yaml"), []byte("name: Docs Kit\n"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(kit, "tp", "render.gohtml"), []byte("{{.post}}"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(kit, "ct", "hello.md"), []byte("---\ntitle: Hello\n---\n\n# Hello\n"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(kit, "ct", "hello.md.md"), []byte("# skill twin\n"), 0644); err != nil {
		t.Fatal(err)
	}

	p, err := Inspect(root)
	if err != nil {
		t.Fatal(err)
	}
	if !p.IsSRE || p.Name != "Test SRE" {
		t.Fatalf("project: %#v", p)
	}
	if len(p.Kits) != 1 || p.Kits[0].NS != "acme" || p.Kits[0].Name != "docs" {
		t.Fatalf("kit: %#v", p.Kits)
	}
	if len(p.Kits[0].Articles) != 1 || p.Kits[0].Articles[0].Slug != "hello" {
		t.Fatalf("articles: %#v", p.Kits[0].Articles)
	}
	if len(p.Kits[0].Templates) != 1 || p.Kits[0].Templates[0] != "render" {
		t.Fatalf("templates: %#v", p.Kits[0].Templates)
	}

	path, err := CreateArticle(kit, "guides/getting-started", "Getting Started", "Intro", []string{"guide"})
	if err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if string(raw)[:3] != "---" {
		t.Fatalf("expected frontmatter: %s", raw)
	}

	p2, _ := Inspect(root)
	hits, err := Search(root, "getting")
	if err != nil {
		t.Fatal(err)
	}
	if len(hits) == 0 {
		t.Fatal("expected search hit")
	}
	if len(p2.Kits[0].Articles) != 2 {
		t.Fatalf("expected 2 articles, got %d", len(p2.Kits[0].Articles))
	}
}

func TestSplitKitDir(t *testing.T) {
	ns, name := splitKitDir("sn.cms")
	if ns != "sn" || name != "cms" {
		t.Fatalf("%s %s", ns, name)
	}
}
