defmodule AdsbSpaceAlgebra do
  @moduledoc """
  AdsbSpaceAlgebra keeps the contexts that define your domain
  and business logic.

  Contexts are also responsible for managing your data, regardless
  if it comes from the database, an external API or others.
  """

  def tickle() do
    AdsbSpaceAlgebraWeb.Endpoint.broadcast!(
      "aircraft:updates",
      "aircraft:position",
      %{features: [
        %{type: "Feature",
          properties: %{
            id: 1
          },
          geometry: %{
            type: "Point",
            coordinates: [ -71 + randomFloat(), 42 + randomFloat() ]
          }
        }
      ]}
    )
  end

  defp randomFloat() do
    :rand.uniform() |> Float.round(3)
  end

end
