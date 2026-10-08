import fs from "node:fs"
import path from "node:path"

const [
  ,
  ,
  workspaceLabel,
  workspaceDir,
  auditPath,
  outputPath,
] = process.argv

function readJson(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      "utf8",
    ),
  )
}

function packageNameFromLocation(location) {
  if (!location) {
    return "(root)"
  }

  const pieces =
    location
      .replaceAll("\\", "/")
      .split("/node_modules/")

  return pieces[
    pieces.length - 1
  ]
}

function packageLocationParent(location) {
  if (!location) {
    return null
  }

  const normalized =
    location.replaceAll(
      "\\",
      "/",
    )

  const marker =
    "/node_modules/"

  const index =
    normalized.lastIndexOf(
      marker,
    )

  if (index >= 0) {
    return normalized.slice(
      0,
      index,
    )
  }

  if (
    normalized.startsWith(
      "node_modules/",
    )
  ) {
    return ""
  }

  return ""
}

function dependencyCandidates(
  fromLocation,
  dependency,
) {
  const candidates = []

  let current =
    fromLocation || ""

  while (true) {
    candidates.push(
      current
        ? `${current}/node_modules/${dependency}`
        : `node_modules/${dependency}`,
    )

    if (!current) {
      break
    }

    current =
      packageLocationParent(
        current,
      )

    if (current === null) {
      break
    }
  }

  return candidates
}

const lockPath =
  path.join(
    workspaceDir,
    "package-lock.json",
  )

const packagePath =
  path.join(
    workspaceDir,
    "package.json",
  )

if (
  !fs.existsSync(lockPath) ||
  !fs.existsSync(packagePath)
) {
  throw new Error(
    `${workspaceLabel}: package manifest/lock missing`,
  )
}

const lock =
  readJson(lockPath)

const rootPackage =
  readJson(packagePath)

const audit =
  readJson(auditPath)

const packages =
  lock.packages || {}

const reverse =
  new Map()

function addReverse(
  child,
  parent,
  dependencyName,
  declaredRange,
) {
  if (!reverse.has(child)) {
    reverse.set(
      child,
      [],
    )
  }

  reverse
    .get(child)
    .push({
      parent,
      dependencyName,
      declaredRange,
    })
}

for (
  const [location, info]
  of Object.entries(packages)
) {
  const dependencies = {
    ...(info.dependencies || {}),
    ...(info.optionalDependencies || {}),
    ...(info.peerDependencies || {}),
  }

  for (
    const [
      dependencyName,
      declaredRange,
    ]
    of Object.entries(
      dependencies,
    )
  ) {
    const candidates =
      dependencyCandidates(
        location,
        dependencyName,
      )

    const child =
      candidates.find(
        candidate =>
          Object.prototype.hasOwnProperty.call(
            packages,
            candidate,
          ),
      )

    if (child) {
      addReverse(
        child,
        location,
        dependencyName,
        declaredRange,
      )
    }
  }
}

function installedVersion(
  location,
) {
  const lockInfo =
    packages[location]

  if (
    lockInfo &&
    lockInfo.version
  ) {
    return lockInfo.version
  }

  const diskPackage =
    path.join(
      workspaceDir,
      location,
      "package.json",
    )

  if (
    fs.existsSync(
      diskPackage,
    )
  ) {
    try {
      return readJson(
        diskPackage,
      ).version || "UNKNOWN"
    } catch {
      return "UNKNOWN"
    }
  }

  return "UNKNOWN"
}

function ancestryPaths(
  target,
) {
  const results = []

  const stack = [
    {
      location: target,
      path: [
        target,
      ],
    },
  ]

  const seen =
    new Set()

  while (
    stack.length
  ) {
    const current =
      stack.pop()

    const key =
      `${current.location}|${current.path.join(">")}`

    if (
      seen.has(
        key,
      )
    ) {
      continue
    }

    seen.add(
      key,
    )

    if (
      current.location === ""
    ) {
      results.push(
        current.path,
      )

      continue
    }

    const parents =
      reverse.get(
        current.location,
      ) || []

    if (
      parents.length === 0
    ) {
      results.push(
        current.path,
      )

      continue
    }

    for (
      const parent
      of parents
    ) {
      if (
        current.path.includes(
          parent.parent,
        )
      ) {
        continue
      }

      stack.push({
        location:
          parent.parent,

        path: [
          ...current.path,
          parent.parent,
        ],
      })
    }
  }

  return results
}

function prettyPath(
  locations,
) {
  return locations
    .slice()
    .reverse()
    .map(
      location => {
        if (
          location === ""
        ) {
          return `${
            rootPackage.name ||
            workspaceLabel
          }@${
            rootPackage.version ||
            "UNKNOWN"
          }`
        }

        return `${
          packageNameFromLocation(
            location,
          )
        }@${
          installedVersion(
            location,
          )
        }`
      },
    )
    .join(
      " -> ",
    )
}

const lines = []

lines.push(
  "======================================================================",
)
lines.push(
  `WORKSPACE=${workspaceLabel}`,
)
lines.push(
  `ROOT_PACKAGE=${rootPackage.name || "UNKNOWN"}`,
)
lines.push(
  `ROOT_VERSION=${rootPackage.version || "UNKNOWN"}`,
)
lines.push(
  "======================================================================",
  "",
)

const vulnerabilities =
  audit.vulnerabilities || {}

const selected =
  Object
    .entries(
      vulnerabilities,
    )
    .filter(
      ([, value]) =>
        value.severity === "critical" ||
        value.severity === "high",
    )
    .sort(
      (
        [nameA, valueA],
        [nameB, valueB],
      ) => {
        const rank = {
          critical: 0,
          high: 1,
        }

        return (
          rank[valueA.severity] -
            rank[valueB.severity] ||
          nameA.localeCompare(
            nameB,
          )
        )
      },
    )

for (
  const [name, info]
  of selected
) {
  lines.push(
    "----------------------------------------------------------------------",
  )

  lines.push(
    `PACKAGE=${name}`,
    `SEVERITY=${info.severity}`,
    `DIRECT=${Boolean(info.isDirect)}`,
    `VULNERABLE_RANGE=${info.range}`,
    `FIX_AVAILABLE=${JSON.stringify(info.fixAvailable)}`,
  )

  const nodes =
    Array.isArray(
      info.nodes,
    )
      ? info.nodes
      : []

  lines.push(
    `AUDIT_NODE_COUNT=${nodes.length}`,
  )

  for (
    const node
    of nodes
  ) {
    lines.push(
      `NODE=${node}`,
      `INSTALLED_VERSION=${installedVersion(node)}`,
    )

    const paths =
      ancestryPaths(
        node,
      )

    if (
      paths.length === 0
    ) {
      lines.push(
        "ANCESTRY=UNRESOLVED",
      )
    } else {
      for (
        const ancestry
        of paths.slice(
          0,
          12,
        )
      ) {
        lines.push(
          `ANCESTRY=${prettyPath(ancestry)}`,
        )
      }

      if (
        paths.length > 12
      ) {
        lines.push(
          `ANCESTRY_MORE=${paths.length - 12}`,
        )
      }
    }
  }

  lines.push(
    "",
  )
}

fs.writeFileSync(
  outputPath,
  lines.join(
    "\n",
  ),
)

console.log(
  `${workspaceLabel}_CRITICAL_HIGH_COUNT=${selected.length}`,
)
