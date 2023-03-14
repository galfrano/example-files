
const model = {
  name: "MenuCategory",
  id: "id",
  columns: ["category", "type"]
};

const camel = (str) => str.charAt(0).toLowerCase() + str.slice(1);

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const splitWords = (str) => {
  let words = [];
  for(let x = 0, i = 0; x < str.length; i += str[x] && str[x].toUpperCase() == str[x] ? 1 : 0 ){
    words[i] != undefined ? words[i] += str[x] : words[i] = str[x]
    x++;
   }
  return words;
}

const dashed = splitWords(model.name).map(word => word.toLowerCase).join('-')

const simplePlural = (str) => str.charAt(str.length-1) == 'y' ? str.slice(0, str.length-2)+'ies' : str+'s'

const select = (model) => {
  let val = ": true, ";
  return model.columns.join(val)+val+model.id+val.slice(0, val.length-2)
}
const selectColumns = select(model)
const camelName = camel(model.name)


let output = `
----------------------------------------------------------------------------------------------------
model
----------------------------------------------------------------------------------------------------

import type { ${model.name} } from "@prisma/client";
import { prisma } from "~/db.server";

export function get${model.name}({ ${model.id} } : Pick<${model.name}, "${model.id}">) {
  return prisma.${camelName}.findFirst({
    select: { ${selectColumns} },
    where: { ${model.id} },
  });
}

export function get${simplePlural(model.name)}() {
  return prisma.${camelName}.findMany({
    select: { ${selectColumns} },
    //orderBy: { type: "desc" },
  });
}

export function create${model.name}({
  ${model.columns.join(",\n  ")}
}: Pick<${model.name}, "${model.columns.join('" | "')}">) {
  return prisma.${camelName}.create({
    data: {
      ${model.columns.join(",\n      ")}
    },
  });
}

export function delete${model.name}({ ${model.id} } : Pick<${model.name}, "${model.id}">) {
  return prisma.${camelName}.delete({ where: { ${model.id} } });
}

----------------------------------------------------------------------------------------------------
$id

----------------------------------------------------------------------------------------------------


import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { delete${model.name}, get${model.name} } from "~/models/${dashed}.server";
import { requireUserId } from "~/session.server";

export async function loader({ request, params }: LoaderArgs) {
  const userId = await requireUserId(request);
  invariant(params.${camelName}Id, "${camelName}Id not found");

  const ${camelName} = await get${model.name}({ id: params.${camelName}Id });
  if (!${camelName}) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ ${camelName} });
}

export async function action({ request, params }: ActionArgs) {
  const userId = await requireUserId(request);
  invariant(params.${camelName}Id, "${camelName}Id not found");

  await delete${model.name}({ id: params.${camelName}Id });

  return redirect("/${dashed}");
}

export default function ${model.name}DetailsPage() {
  const { ${camelName} } = useLoaderData<typeof loader>();

  return (
    <div>
      <h3 className="text-2xl font-bold">{${camelName}.${model.columns[0]}}</h3>
      ${model.columns.reduce((acc, curr, i) => acc += i != 0 ? `      <p className="py-6">{${camelName}.${curr}}</p>\n` : '')}
      <hr className="my-4" />
      <Form method="post">
        <button
          type="submit"
          className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Delete
        </button>
      </Form>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>${splitWords(model.name).join(' ')} not found</div>;
  }

  throw new Error(\`Unexpected caught response with status: \${caught.status}\`);
}

----------------------------------------------------------------------------------------------------
index
----------------------------------------------------------------------------------------------------
import { Link } from "@remix-run/react";

export default function ${model.name}IndexPage() {
  return (
    <p>
      No ${splitWords(model.name).join(' ')} selected. Select a ${splitWords(model.name).join(' ')} on the left, or{" "}
      <Link to="new" className="text-blue-500 underline">
        create a new ${splitWords(model.name).join(' ')}.
      </Link>
    </p>
  );
}

----------------------------------------------------------------------------------------------------
new
----------------------------------------------------------------------------------------------------

import type { ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import * as React from "react";
// import { MenuCategoryType } from "@prisma/client";
import { create${model.name} } from "~/models/${dashed}server";
import { requireUserId } from "~/session.server";

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);
  // TODO: security
  const formData = await request.formData();
  
${model.columns.reduce((acc, curr) =>{
  acc += `  const ${curr} = formData.get("${curr}");
  if (typeof ${curr} !== "string" || ${curr}.length === 0) {
    return json(
      { errors: { ${curr}: "${capitalize(curr)} is required", ${curr}: null } },
      { status: 400 }
    );
  }\n`})}

  const new${model.name} = await create${model.name}({ ${model.columns.join(', ')} });

  return redirect(\`/${dashed}/\${new${model.name}.id}\`);
}

export default function New${model.name}Page() {
  const actionData = useActionData<typeof action>();
${model.columns.reduce((acc, curr) => acc += `  const ${curr}Ref = React.useRef<HTMLInputElement>(null);\n`)}


  React.useEffect(() => {
    ${model.columns.map((x) => `if (actionData?.errors?.${x}) {
      ${x}Ref.current?.focus();
    }`).join(' else ')}
  }, [actionData]);

  return (
    <Form
      method="post"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
    >
${model.columns.reduce((acc, curr) => acc += `      <div>
        <label className="flex w-full flex-col gap-1">
          <span>${capitalize(curr)}: </span>
          <input
            ref={${curr}Ref}
            name="${curr}"
            className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
            aria-invalid={actionData?.errors?.name ? true : undefined}
            aria-errormessage={
              actionData?.errors?.name ? "${curr}-error" : undefined
            }
          />
        </label>
        {actionData?.errors?.${curr} && (
          <div className="pt-1 text-red-700" id="${curr}-error">
            {actionData.errors.${curr}}
          </div>
        )}
      </div>\n`)}


      <div className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Save
        </button>
      </div>
    </Form>
  );
}

----------------------------------------------------------------------------------------------------
named
----------------------------------------------------------------------------------------------------
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";

import { get${simplePlural(model.name)}} from "~/models/${dashed}.server";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  // TODO: user seggregation
  const list = await get${simplePlural(model.name)}();
  return json({ list });
}

export default function ${simplePlural(model.name)}Page() {
  const { list } = useLoaderData<typeof loader>();
  const user = useUser();

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">${splitWords(simplePlural(model.name)).join(' ')}</Link>
        </h1>
        <p>{user.email}</p>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
          >
            Logout
          </button>
        </Form>
      </header>

      <main className="flex h-full bg-white">
        <div className="h-full w-80 border-r bg-gray-50">
          <Link to="new" className="block p-4 text-xl text-blue-500">
            + New ${splitWords(model.name).join(' ')}
          </Link>

          <hr />

          {list.length === 0 ? (
            <p className="p-4">No ${splitWords(simplePlural(model.name)).join(' ')} yet</p>
          ) : (
            <ol>
              {list.map((item) => (
                <li key={item.${model.id}}>
                  <NavLink
                    className={({ isActive }) =>
                      \`block border-b p-4 text-xl \${isActive ? "bg-white" : ""}\`
                    }
                    to={item.${model.id}}
                  >
                    📝 {item.${model.columns[0]}}
                  </NavLink>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}



`
console.log(output)
