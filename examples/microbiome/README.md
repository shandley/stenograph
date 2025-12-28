# Microbiome Analysis Vignette

A realistic IBD microbiome study workflow using steno-graph.

## The Dataset

- **18 samples** from 3 cohorts:
  - Healthy controls (H01-H06)
  - Crohn's disease patients on anti-TNF therapy (CD01-CD06)
  - Ulcerative colitis patients receiving FMT (UC01-UC06)
- **15 ASVs** (Amplicon Sequence Variants)
- Includes longitudinal timepoints for disease cohorts

### Files

| File | Description |
|------|-------------|
| `counts.csv` | ASV count table (samples × features) |
| `metadata.csv` | Sample metadata (condition, treatment, timepoint) |
| `taxonomy.csv` | Taxonomic classifications (kingdom → species) |

## Steno Workflow

### 1. Initial Exploration

```bash
# Explore the count data
dx:@counts.csv

# Check sample metadata
dx:@metadata.csv

# Review taxonomy
dx:@taxonomy.csv
```

### 2. Data QC & Normalization

```bash
# Quality check - look for outliers, low-count samples
dx:@counts.csv +qc

# Normalize counts (relative abundance or CLR)
ch:@counts.csv +normalize .method:clr
```

### 3. Diversity Analysis

```bash
# Alpha diversity (within-sample)
stat:alpha @counts.csv .metrics:shannon,chao1

# Beta diversity (between-sample)
stat:beta @counts.csv .distance:bray-curtis

# Visualize beta diversity
viz:pcoa @counts.csv @metadata.csv +color:condition
```

### 4. Differential Abundance

```bash
# Compare healthy vs Crohn's
stat:diff @counts.csv @metadata.csv .groups:healthy,crohns

# Compare pre/post FMT in UC patients
stat:diff @counts.csv @metadata.csv .groups:pre,post .subset:ulcerative_colitis
```

### 5. Taxonomic Visualization

```bash
# Phylum-level barplot
viz:barplot @counts.csv @taxonomy.csv +level:phylum +group:condition

# Genus-level heatmap
viz:heatmap @counts.csv @taxonomy.csv +level:genus +cluster
```

### 6. Exploring Alternatives with Branching

```bash
# Baseline analysis
stat:diff @counts.csv @metadata.csv .groups:healthy,crohns
steno:bookmark baseline-diff

# Try different statistical approaches
fork:deseq2
stat:diff @counts.csv @metadata.csv .method:deseq2 .groups:healthy,crohns

switch:main
fork:ancombc
stat:diff @counts.csv @metadata.csv .method:ancombc .groups:healthy,crohns

# Compare results
compare:deseq2 ancombc

# Adopt preferred method
merge:ancombc
```

### 7. Report Generation

```bash
# Generate analysis report
doc:@counts.csv @metadata.csv +diversity +diff-abundance .format:html

# Export key figures
viz:summary @counts.csv @metadata.csv .export:figures/
```

## Workflow Patterns

### Chaining with `^`

```bash
dx:@counts.csv                    # Explore counts
ch:^ +filter .min-count:10        # Filter low-abundance ASVs
ch:^ +normalize .method:clr       # CLR transform
viz:pcoa ^                        # PCA of normalized data
steno:bookmark clean-normalized   # Save checkpoint
```

### Conditional Exploration

```bash
# Check if normalization looks good
dx:^ ~deep

# If issues found, try alternative
fork:try-rarefy
ch:@counts.csv +rarefy .depth:1000
viz:pcoa ^

# Compare approaches
compare:main try-rarefy
```

### Stale Detection

```bash
# After updating counts.csv with new samples
steno:stale
# Reports which analyses need re-running

steno:refresh
# Re-runs affected commands in order
```

## Key Findings (Expected)

Running this workflow reveals:
1. **Dysbiosis in IBD** — Reduced Firmicutes, increased Proteobacteria
2. **FMT response** — Post-FMT samples cluster closer to healthy
3. **Akkermansia** — Low in CD, restored after FMT
4. **Faecalibacterium prausnitzii** — Depleted in active disease

## Command Reference

| Task | Command |
|------|---------|
| Explore data | `dx:@file.csv` |
| Normalize | `ch:@counts.csv +normalize` |
| Alpha diversity | `stat:alpha @counts.csv` |
| Beta diversity | `stat:beta @counts.csv` |
| Ordination plot | `viz:pcoa @counts.csv` |
| Differential | `stat:diff @counts.csv @meta.csv` |
| Heatmap | `viz:heatmap @counts.csv +cluster` |
| Deep analysis | `dx:@file.csv ~deep` |
| Ask first | `stat:test? @data.csv` |
