defmodule AdsbSpaceAlgebra do
  @moduledoc """
  AdsbSpaceAlgebra keeps the contexts that define your domain
  and business logic.

  Contexts are also responsible for managing your data, regardless
  if it comes from the database, an external API or others.
  """

  @alphabet Enum.concat([?0..?9, ?A..?Z, ?a..?z])

  def randstring(count) do
    # Technically not needed, but just to illustrate we're
    # relying on the PRNG for this in random/1
    :rand.seed(:exsplus, :os.timestamp())
    Stream.repeatedly(&random_char_from_alphabet/0)
    |> Enum.take(count)
    |> List.to_string()
  end
  defp random_char_from_alphabet() do
    Enum.random(@alphabet)
  end

  def tickle(file_name, delay) do
    # AdsbSpaceAlgebraWeb.Endpoint.broadcast!(
    #   "aircraft:updates",
    #   "aircraft:position",
    #   %{icoa: randstring(5),
    #     lon: (-71 - :rand.uniform()),
    #     lat: (41 + :rand.uniform()),
    #     altitude: :rand.uniform(30000),
    #     heading: :rand.uniform(360),
    #     speed: :rand.uniform(300)
    #   })

    File.stream!(file_name)
      |> Stream.map(fn(msg) ->
          AdsbSpaceAlgebra.Network.Client.handle_adsb msg
          :timer.sleep(delay)
        end)
      |> Stream.run
  end

end
